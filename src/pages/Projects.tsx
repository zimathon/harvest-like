import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
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
import { MdAdd, MdArchive, MdEdit, MdSearch } from 'react-icons/md'
import { useClients } from '../contexts/ClientContext.js'
import { useProjects } from '../contexts/ProjectContext.js'
import { Project } from '../types/index.js'

type ProjectStatus = Project['status']

const Projects = () => {
  const { projects, isLoading, error, updateProject, addProject } = useProjects()
  const { clients, isLoading: clientsLoading } = useClients()
  const clientList = useMemo(() => clients, [clients])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null) // 編集用プロジェクト
  const toast = useToast() // Toastを追加

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.client.name.toLowerCase().includes(searchTerm.toLowerCase()) // client.nameで検索 // client.nameで検索
  )

  const handleArchive = async (id: string) => {
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
  // --- Project Form State End ---

  // モーダル開閉時の初期化/設定
  useEffect(() => {
    if (isOpen) {
      if (selectedProject) {
        setProjectName(selectedProject.name)
        setClientId(selectedProject.client.id) // client.idを使用
        setDescription(selectedProject.description || '')
        setStatus(selectedProject.status)
        setBudget(selectedProject.budget || '')
        setBudgetType(selectedProject.budgetType || 'hourly')
        setHourlyRate(selectedProject.hourlyRate || '')
      } else {
        // 新規作成時はフォームをリセット
        setProjectName('')
        setClientId('')
        setDescription('')
        setStatus('active')
        setBudget('')
        setBudgetType('hourly')
        setHourlyRate('')
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
    setSelectedProject(project) // 編集対象をセット
    onOpen()
  }

  // --- Save Project Logic ---
  const handleSaveProject = async () => {
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
    setIsSubmitting(true)
    try {
      const budgetNumber = typeof budget === 'string' ? parseFloat(budget) : budget || 0
      const rateNumber = typeof hourlyRate === 'string' ? parseFloat(hourlyRate) : hourlyRate || 0

      const selectedClient = clientList.find(c => c.id === clientId);
      if (!selectedClient) {
        toast({
          title: 'Validation Error',
          description: 'Selected client not found.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const projectData = {
        name: projectName,
        client: selectedClient, // Clientオブジェクトを渡す
        description,
        status,
        budget: isNaN(budgetNumber) ? 0 : budgetNumber,
        budgetType,
        hourlyRate: isNaN(rateNumber) ? 0 : rateNumber,
      }

      if (selectedProject) {
        await updateProject(selectedProject.id, projectData)
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
              // project.clientは既にClientオブジェクトになっているはず
              const clientName = project.client.name || 'N/A'

              return (
                <Tr key={project.id}>
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
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleArchive(project.id)}>
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
                  >
                    {clientList.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </Select>
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