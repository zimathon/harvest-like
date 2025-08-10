import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast, // Toastを追加
  VStack // VStackを追加
} from '@chakra-ui/react'
import React, { useEffect, useMemo, useState } from 'react' // useEffectを追加
import { MdAdd, MdArchive, MdEdit, MdSearch, MdDelete } from 'react-icons/md'
import { useClients } from '../contexts/ClientContext.js'
import { useProjects } from '../contexts/ProjectContext.js'
import { Project } from '../types/index.js'

type ProjectStatus = Project['status']

const Projects = () => {
  const { projects, isLoading, error, updateProject, addProject } = useProjects()
  const { clients, isLoading: clientsLoading } = useClients()
  const clientList = useMemo(() => {
    console.log('Debug: clients from context =', clients);
    return clients;
  }, [clients])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null) // 編集用プロジェクト
  const toast = useToast() // Toastを追加

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (project.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) // clientNameで検索（Firestore版）
  )

  const handleArchive = async (id: string) => {
    console.log('Debug: Archiving project with ID =', id);
    if (window.confirm('Are you sure you want to archive this project?')) {
      try {
        await updateProject(id, { status: 'archived' }) // statusをarchivedに更新
        toast({
          title: "Project archived.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        console.error("Failed to archive project:", err)
        toast({
          title: "Error archiving project.",
          description: err instanceof Error ? err.message : "Could not archive project.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }

  // --- Project Form State ---
  const [projectName, setProjectName] = useState('')
  const [clientId, setClientId] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [budget, setBudget] = useState<number | string>('')
  const [budgetType, setBudgetType] = useState<'hourly' | 'fixed'>('hourly')
  const [hourlyRate, setHourlyRate] = useState<number | string>('')
  const [tasks, setTasks] = useState<Array<{ name: string; hourlyRate?: number; isBillable: boolean }>>([])
  // --- Project Form State End ---

  // モーダル開閉時の初期化/設定
  useEffect(() => {
    console.log('Debug: useEffect triggered, isOpen =', isOpen, 'selectedProject =', selectedProject);
    if (isOpen) {
      if (selectedProject) {
        console.log('Debug: Setting form for editing project');
        console.log('Debug: selectedProject.client =', selectedProject.client);
        setProjectName(selectedProject.name)
        // Firestore版とMongoDB版の両方に対応
        const clientIdValue = selectedProject.clientId || // Firestore版
          (typeof selectedProject.client === 'string' 
            ? selectedProject.client 
            : (selectedProject.client?._id || selectedProject.client?.id)) || '';
        setClientId(clientIdValue)
        setDescription(selectedProject.description || '')
        setStatus(selectedProject.status)
        setBudget(selectedProject.budget || '')
        setBudgetType(selectedProject.budgetType || 'hourly')
        setHourlyRate(selectedProject.hourlyRate || '')
        setTasks(selectedProject.tasks || [])
        console.log('Debug: Form state set - projectName:', selectedProject.name, 'clientId:', clientIdValue);
      } else {
        console.log('Debug: Setting form for new project');
        // 新規作成時はフォームをリセット
        setProjectName('')
        setClientId('')
        setDescription('')
        setStatus('active')
        setBudget('')
        setBudgetType('hourly')
        setHourlyRate('')
        setTasks([])
      }
    }
  }, [isOpen, selectedProject])

  // 新規作成モーダルを開く
  const handleOpenNewModal = () => {
    setSelectedProject(null) // 編集対象をリセット
    onOpen()
  }

  // 編集モーダルを開く
  const handleOpenEditModal = (project: Project) => {
    console.log('Debug: Opening edit modal for project =', project);
    setSelectedProject(project) // 編集対象をセット
    onOpen()
  }

  // --- Save Project Logic ---
  const handleSaveProject = async () => {
    console.log('Debug: handleSaveProject called');
    console.log('Debug: projectName =', projectName);
    console.log('Debug: clientId =', clientId);
    console.log('Debug: selectedProject =', selectedProject);
    
    if (!projectName || !clientId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in Project Name and Client.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return
    }

    // クライアントデータが読み込まれていない場合は処理を停止
    if (clientsLoading) {
      toast({
        title: 'Please wait',
        description: 'Loading client data...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true)
    try {
      const budgetNumber = typeof budget === 'string' ? parseFloat(budget) : budget || 0
      const rateNumber = typeof hourlyRate === 'string' ? parseFloat(hourlyRate) : hourlyRate || 0

      // クライアントデータが読み込まれた後にバリデーションを実行
      console.log('Debug: clientId =', clientId);
      console.log('Debug: clientList =', clientList);
      console.log('Debug: clientList.length =', clientList.length);
      
      const selectedClient = clientList.find(c => (c._id || c.id) === clientId);
      console.log('Debug: selectedClient =', selectedClient);
      
      if (!selectedClient) {
        toast({
          title: 'Validation Error',
          description: 'Selected client not found. Please refresh the page and try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const projectData = {
        name: projectName,
        client: clientId, // API expects 'client' field
        clientId: clientId, // Keep for backward compatibility
        description,
        status,
        budget: isNaN(budgetNumber) ? 0 : budgetNumber,
        budgetType,
        hourlyRate: isNaN(rateNumber) ? 0 : rateNumber,
        tasks: tasks,
      };

      if (selectedProject) {
        await updateProject(selectedProject._id || selectedProject.id, projectData)
        toast({
          title: 'Project updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addProject(projectData)
        toast({
          title: 'Project created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose()
    } catch (err) {
      console.error("Failed to save project:", err)
      toast({
        title: "Error saving project.",
        description: err instanceof Error ? err.message : "Could not save project.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false)
    }
  }
  // --- Save Project Logic End ---

  // タスク管理のヘルパー関数
  const addTask = () => {
    setTasks([...tasks, { name: '', hourlyRate: 0, isBillable: true }])
  }

  const updateTask = (index: number, field: string, value: any) => {
    const updatedTasks = [...tasks]
    updatedTasks[index] = { ...updatedTasks[index], [field]: value }
    setTasks(updatedTasks)
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  if (isLoading || clientsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading projects: {error}
      </Alert>
    )
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Projects</Heading>
        <Button colorScheme="blue" leftIcon={<MdAdd />} onClick={handleOpenNewModal}>
          New Project
        </Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search projects (name, client)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </HStack>
      
      {filteredProjects.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Client</Th>
              <Th>Status</Th>
              <Th isNumeric>Budget</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredProjects.map((project) => {
              // Firestore版ではclientNameが直接含まれている
              const clientName = project.clientName || (typeof project.client === 'object' ? project.client?.name : project.client) || 'N/A'

              return (
                <Tr key={project._id || project.id}>
                  <Td fontWeight="medium">{project.name}</Td>
                  <Td>{clientName}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        project.status === 'active' ? 'green' :
                        project.status === 'on hold' ? 'yellow' :
                        project.status === 'archived' ? 'gray' :
                        project.status === 'completed' ? 'blue' :
                        'gray'
                      }
                      textTransform="capitalize"
                    >
                      {project.status}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    {project.budget != null ? `${project.budget.toLocaleString()}` : 'N/A'}
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <Button size="xs" variant="ghost" onClick={() => handleOpenEditModal(project)}>
                        <Icon as={MdEdit} />
                      </Button>
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleArchive(project._id || project.id)}>
                        <Icon as={MdArchive} />
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No projects found{searchTerm ? ' matching your search' : ''}.</Text>
          <Button mt={4} colorScheme="blue" leftIcon={<MdAdd />} onClick={handleOpenNewModal}>
            Create your first project
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedProject ? 'Edit Project' : 'New Project'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box as="form" onSubmit={(e: React.FormEvent<HTMLDivElement>) => e.preventDefault()}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Project Name</FormLabel>
                  <Input
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Client</FormLabel>
                  <Select
                    placeholder="Select client"
                    value={clientId}
                    isDisabled={clientsLoading}
                    onChange={(e) => {
                      console.log('Debug: Client selected =', e.target.value);
                      setClientId(e.target.value);
                    }}
                  >
                    {clientList.map(client => {
                      console.log('Debug: Rendering client option =', client);
                      return (
                        <option key={client._id || client.id} value={client._id || client.id}>{client.name}</option>
                      );
                    })}
                  </Select>
                  {clientsLoading && <Text fontSize="sm" color="gray.500">Loading clients...</Text>}
                  {!clientsLoading && clientList.length === 0 && (
                    <Text fontSize="sm" color="red.500">No clients available. Please create a client first.</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    placeholder="Project description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FormControl>

                <HStack w="full" spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel>Status</FormLabel>
                    <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                      <option value="active">Active</option>
                      <option value="on hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </FormControl>
                  <FormControl flex={1}>
                    <FormLabel>Budget Type</FormLabel>
                    <Select value={budgetType} onChange={(e) => setBudgetType(e.target.value as typeof budgetType)}>
                      <option value="hourly">Hourly Rate</option>
                      <option value="fixed">Fixed Budget</option>
                    </Select>
                  </FormControl>
                </HStack>

                <HStack w="full" spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel>
                      {budgetType === 'fixed' ? 'Total Budget ($)' : 'Budget Estimate ($)'}
                    </FormLabel>
                    <NumberInput
                      min={0}
                      value={budget}
                      onChange={(valueString) => setBudget(valueString)}
                    >
                      <NumberInputField placeholder="0.00" />
                    </NumberInput>
                  </FormControl>
                  {budgetType === 'hourly' && (
                    <FormControl flex={1}>
                      <FormLabel>Hourly Rate ($)</FormLabel>
                      <NumberInput
                        min={0}
                        value={hourlyRate}
                        onChange={(valueString) => setHourlyRate(valueString)}
                      >
                        <NumberInputField placeholder="0.00" />
                      </NumberInput>
                    </FormControl>
                  )}
                </HStack>

                {/* タスク管理セクション */}
                <FormControl>
                  <HStack justify="space-between" mb={3}>
                    <FormLabel mb={0}>Tasks</FormLabel>
                    <Button size="sm" leftIcon={<MdAdd />} onClick={addTask} type="button">
                      Add Task
                    </Button>
                  </HStack>
                  
                  {tasks.length === 0 ? (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                      No tasks added yet. Add a task to enable time tracking.
                    </Text>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {tasks.map((task, index) => (
                        <HStack key={index} spacing={2} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                          <Input
                            placeholder="Task name"
                            value={task.name}
                            onChange={(e) => updateTask(index, 'name', e.target.value)}
                            size="sm"
                            flex={2}
                          />
                          <NumberInput
                            size="sm"
                            min={0}
                            flex={1}
                            value={task.hourlyRate || ''}
                            onChange={(value) => updateTask(index, 'hourlyRate', parseFloat(value) || 0)}
                          >
                            <NumberInputField placeholder="Rate" />
                          </NumberInput>
                          <Checkbox
                            isChecked={task.isBillable}
                            onChange={(e) => updateTask(index, 'isBillable', e.target.checked)}
                          >
                            Billable
                          </Checkbox>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeTask(index)}
                            type="button"
                          >
                            <MdDelete />
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </FormControl>

              </VStack>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveProject}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || clientsLoading}
            >
              {selectedProject ? 'Update Project' : 'Save Project'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Projects