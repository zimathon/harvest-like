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
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  NumberInput,
  NumberInputField
} from '@chakra-ui/react'
import { useState } from 'react'
import { MdSearch, MdMoreVert, MdAttachFile, MdEdit, MdDelete, MdAdd } from 'react-icons/md'

const expensesData = [
  {
    id: 1,
    description: 'Client lunch meeting',
    category: 'Meals & Entertainment',
    date: '2025-04-15',
    amount: '$65.00',
    project: 'Website Redesign',
    status: 'Approved'
  },
  {
    id: 2,
    description: 'Software subscription',
    category: 'Software',
    date: '2025-04-10',
    amount: '$49.99',
    project: 'Mobile App Development',
    status: 'Pending'
  },
  {
    id: 3,
    description: 'Office supplies',
    category: 'Office Supplies',
    date: '2025-04-05',
    amount: '$32.50',
    project: 'General',
    status: 'Approved'
  }
]

const Expenses = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Expenses</Heading>
        <Button colorScheme="blue" leftIcon={<MdAdd />} onClick={onOpen}>
          New Expense
        </Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search expenses" />
        </InputGroup>
      </HStack>
      
      {expensesData.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Project</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {expensesData.map((expense) => (
              <Tr key={expense.id}>
                <Td>{expense.date}</Td>
                <Td fontWeight="medium">{expense.description}</Td>
                <Td>{expense.category}</Td>
                <Td>{expense.project}</Td>
                <Td>{expense.amount}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      expense.status === 'Approved'
                        ? 'green'
                        : expense.status === 'Rejected'
                        ? 'red'
                        : 'yellow'
                    }
                  >
                    {expense.status}
                  </Badge>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      size="sm"
                      rightIcon={<MdMoreVert />}
                    >
                      Actions
                    </MenuButton>
                    <MenuList>
                      <MenuItem icon={<MdAttachFile />}>View Receipt</MenuItem>
                      <MenuItem icon={<MdEdit />}>Edit</MenuItem>
                      <MenuItem icon={<MdDelete />}>Delete</MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No expenses found.</Text>
          <Button mt={4} colorScheme="blue" onClick={onOpen}>
            Add your first expense
          </Button>
        </Box>
      )}
      
      {/* New Expense Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Expense</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form">
              <FormControl mb={4} isRequired>
                <FormLabel>Description</FormLabel>
                <Input placeholder="Brief description of the expense" />
              </FormControl>
              
              <HStack spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select placeholder="Select category">
                    <option>Meals & Entertainment</option>
                    <option>Transportation</option>
                    <option>Office Supplies</option>
                    <option>Software</option>
                    <option>Hardware</option>
                    <option>Other</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input type="date" />
                </FormControl>
              </HStack>
              
              <HStack spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput min={0}>
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Project</FormLabel>
                  <Select placeholder="Select project">
                    <option>Website Redesign</option>
                    <option>Mobile App Development</option>
                    <option>Marketing Campaign</option>
                    <option>General</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl mb={4}>
                <FormLabel>Notes</FormLabel>
                <Textarea placeholder="Additional notes" />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Upload Receipt</FormLabel>
                <Button leftIcon={<MdAttachFile />} variant="outline">
                  Choose File
                </Button>
                <Text fontSize="sm" mt={1} color="gray.500">
                  No file selected
                </Text>
              </FormControl>
            </Box>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue">Save Expense</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Expenses