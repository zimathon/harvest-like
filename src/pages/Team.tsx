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
  Avatar,
  Text,
  InputGroup,
  InputLeftElement,
  Input,
  Icon
} from '@chakra-ui/react'
import { MdSearch, MdMail, MdEdit, MdDelete } from 'react-icons/md'

const teamData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'Active',
    hoursThisWeek: 35
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Developer',
    status: 'Active',
    hoursThisWeek: 40
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'Designer',
    status: 'Inactive',
    hoursThisWeek: 0
  }
]

const Team = () => {
  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Team</Heading>
        <Button colorScheme="blue">Invite Member</Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search team members" />
        </InputGroup>
      </HStack>
      
      {teamData.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Hours This Week</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {teamData.map((member) => (
              <Tr key={member.id}>
                <Td>
                  <HStack>
                    <Avatar size="sm" name={member.name} />
                    <Text fontWeight="medium">{member.name}</Text>
                  </HStack>
                </Td>
                <Td>{member.email}</Td>
                <Td>{member.role}</Td>
                <Td>
                  <Badge colorScheme={member.status === 'Active' ? 'green' : 'gray'}>
                    {member.status}
                  </Badge>
                </Td>
                <Td>{member.hoursThisWeek}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="sm" leftIcon={<MdMail />} variant="ghost">
                      Message
                    </Button>
                    <Button size="sm" leftIcon={<MdEdit />} variant="ghost">
                      Edit
                    </Button>
                    <Button size="sm" leftIcon={<MdDelete />} variant="ghost" colorScheme="red">
                      Remove
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No team members found.</Text>
          <Button mt={4} colorScheme="blue">Invite your first team member</Button>
        </Box>
      )}
    </Box>
  )
}

export default Team