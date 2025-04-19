import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon
} from '@chakra-ui/react'
import { MdSearch, MdEdit, MdArchive } from 'react-icons/md'

const projectsData = [
  {
    id: 1,
    name: 'Website Redesign',
    client: 'Acme Inc.',
    status: 'Active',
    budget: '$10,000',
    spent: '$5,500',
    deadline: '2025-06-30'
  },
  {
    id: 2,
    name: 'Mobile App Development',
    client: 'TechCorp',
    status: 'Active',
    budget: '$25,000',
    spent: '$8,200',
    deadline: '2025-09-15'
  },
  {
    id: 3,
    name: 'Marketing Campaign',
    client: 'Global Retail',
    status: 'On Hold',
    budget: '$5,000',
    spent: '$1,800',
    deadline: '2025-05-01'
  }
]

const Projects = () => {
  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Projects</Heading>
        <Button colorScheme="blue">New Project</Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search projects" />
        </InputGroup>
      </HStack>
      
      {projectsData.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Client</Th>
              <Th>Status</Th>
              <Th>Budget</Th>
              <Th>Spent</Th>
              <Th>Deadline</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {projectsData.map((project) => (
              <Tr key={project.id}>
                <Td fontWeight="medium">{project.name}</Td>
                <Td>{project.client}</Td>
                <Td>
                  <Badge colorScheme={project.status === 'Active' ? 'green' : 'yellow'}>
                    {project.status}
                  </Badge>
                </Td>
                <Td>{project.budget}</Td>
                <Td>{project.spent}</Td>
                <Td>{project.deadline}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="sm" leftIcon={<MdEdit />} variant="ghost">
                      Edit
                    </Button>
                    <Button size="sm" leftIcon={<MdArchive />} variant="ghost">
                      Archive
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No projects found.</Text>
          <Button mt={4} colorScheme="blue">Create your first project</Button>
        </Box>
      )}
    </Box>
  )
}

export default Projects