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
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { MdSearch, MdMail, MdEdit, MdDelete, MdPersonAdd } from 'react-icons/md'
import { useState } from 'react'
import { useUsers } from '../contexts/UserContext'
import { apiClient } from '../lib/api-client'

const Team = () => {
  const { users, isLoading, error, fetchUsers } = useUsers();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsInviting(true);
    try {
      // Create a new user account via API
      const response = await apiClient.createUser({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole as 'admin' | 'user',
        password: 'temp123456' // Temporary password - should be changed on first login
      });

      if (response.data) {
        toast({
          title: 'Success',
          description: `Successfully invited ${inviteName} to the team. An invitation email has been sent.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh the users list
        await fetchUsers();
        
        // Reset form and close modal
        setInviteEmail('');
        setInviteName('');
        setInviteRole('member');
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite team member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading team members: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Team</Heading>
        <Button colorScheme="blue" leftIcon={<MdPersonAdd />} onClick={onOpen}>
          Invite Member
        </Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search team members" />
        </InputGroup>
      </HStack>
      
      {users.length > 0 ? (
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
            {users.map((member) => (
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
                  <Badge colorScheme={member.role === 'admin' || member.role === 'manager' ? 'green' : 'gray'}>
                    {member.role}
                  </Badge>
                </Td>
                <Td>N/A</Td> {/* Hours This Week is not available in User type */}
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
          <Button mt={4} colorScheme="blue" leftIcon={<MdPersonAdd />} onClick={onOpen}>
            Invite your first team member
          </Button>
        </Box>
      )}

      {/* Invite Team Member Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invite Team Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input 
                  placeholder="Enter team member's name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email"
                  placeholder="Enter team member's email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </Select>
              </FormControl>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">The invited member will receive an email with:</Text>
                  <Text>• Login instructions</Text>
                  <Text>• Temporary password: temp123456</Text>
                  <Text fontSize="sm" mt={2}>Note: In development mode, emails are logged to the console instead of being sent.</Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleInvite}
              isLoading={isInviting}
              loadingText="Inviting..."
            >
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Team