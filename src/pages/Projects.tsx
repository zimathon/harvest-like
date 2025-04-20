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
  VStack
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { MdAdd, MdArchive, MdEdit, MdSearch } from 'react-icons/md'
import { useClients } from '../contexts/ClientContext.js'
import { useProjects } from '../contexts/ProjectContext.js'
import { Project } from '../types/index.js'

type ProjectStatus = Project['status']

const Projects = () => {
  const { projects, isLoading, error, fetchProjects, deleteProject, addProject } = useProjects()
  const { clients: clientList, isLoading: clientsLoading } = useClients()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleArchive = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this project? (This will delete it)')) {
      try {
        await deleteProject(id)
      } catch (err) {
        console.error("Failed to archive project:", err)
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

  // --- Save Project Logic ---
  const handleSaveProject = async () => {
    if (!projectName || !clientId) {
      alert('Please fill in Project Name and Client.')
      return
    }
    setIsSubmitting(true)
    try {
      const budgetNumber = typeof budget === 'string' ? parseFloat(budget) : budget || 0
      const rateNumber = typeof hourlyRate === 'string' ? parseFloat(hourlyRate) : hourlyRate || 0

      await addProject({
        name: projectName,
        client: clientId,
        description,
        status,
        budget: isNaN(budgetNumber) ? 0 : budgetNumber,
        budgetType,
        hourlyRate: isNaN(rateNumber) ? 0 : rateNumber,
      })
      onClose()
      setProjectName('')
      setClientId('')
      setDescription('')
      setStatus('active')
      setBudget('')
      setBudgetType('hourly')
      setHourlyRate('')
    } catch (err) {
      console.error("Failed to save project:", err)
      alert(`Error saving project: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
        <Button colorScheme="blue" leftIcon={<MdAdd />} onClick={onOpen}>
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
              const client = clientList.find(c => c.id === project.client)
              const clientName = client?.name || 'N/A'

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
                    {project.budget != null ? `$${project.budget.toLocaleString()}` : 'N/A'}
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <Button size="xs" variant="ghost" onClick={() => console.log('Edit', project.id)}>
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
          <Button mt={4} colorScheme="blue" leftIcon={<MdAdd />} onClick={onOpen}>
            Create your first project
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Project</ModalHeader>
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
                    onChange={(e) => setClientId(e.target.value)}
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
              Save Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Projects