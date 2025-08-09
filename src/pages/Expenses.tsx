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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
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
  useToast // Add useToast
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { MdAdd, MdAttachFile, MdDelete, MdEdit, MdMoreVert, MdSearch } from 'react-icons/md'
import { useExpenses } from '../contexts/ExpenseContext.js'
import { useProjects } from '../contexts/ProjectContext.js'
import { useAuth } from '../contexts/AuthContext.js'; // useAuthをインポート
import { Expense } from '../types/index.js' // Import Project type

const Expenses = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { expenses, isLoading, error, fetchExpenses, deleteExpense, addExpense, updateExpense } = useExpenses() // Add updateExpense
  const { projects: projectList } = useProjects()
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast() // Initialize useToast
  const { user } = useAuth(); // 認証ユーザー情報を取得

  // --- Modal State ---
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState<number | string>('')
  const [selectedProjectId, setSelectedProjectId] = useState('') // Renamed from projectId to avoid confusion
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null) // For editing
  // --- Modal State End ---

  useEffect(() => {
    // fetchExpenses(); // Context handles fetching based on user
  }, [fetchExpenses])

  // Reset form when modal opens/closes or selectedExpense changes
  useEffect(() => {
    if (isOpen) {
      if (selectedExpense) {
        setDescription(selectedExpense.description)
        setCategory(selectedExpense.category)
        setDate(selectedExpense.date)
        setAmount(selectedExpense.amount)
        setSelectedProjectId(selectedExpense.project.id) // Use project.id
        setNotes(selectedExpense.notes || '')
      } else {
        // Reset for new expense
        setDescription('')
        setCategory('')
        setDate('')
        setAmount('')
        setSelectedProjectId('')
        setNotes('')
      }
    }
  }, [isOpen, selectedExpense])

  const filteredExpenses = expenses.filter(expense => {
    // Use expense.project.name for filtering
    const projectName = expense.project?.name || ''
    return (
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id)
        toast({
          title: "Expense deleted.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        console.error("Failed to delete expense:", err)
        toast({
          title: "Error deleting expense.",
          description: err instanceof Error ? err.message : "Could not delete expense.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }

  // Open modal for new expense
  const handleOpenNewModal = () => {
    setSelectedExpense(null)
    onOpen()
  }

  // Open modal for editing expense
  const handleOpenEditModal = (expense: Expense) => {
    setSelectedExpense(expense)
    onOpen()
  }

  // --- Modal Submit Logic ---
  const handleSaveExpense = async () => {
    if (!description || !category || !date || !amount || !selectedProjectId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields, including Project.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return
    }

    setIsSubmitting(true)
    try {
      const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount
      if (isNaN(amountNumber)) {
        throw new Error("Invalid Amount")
      }

      // Find the full Project object
      const projectObject = projectList.find(p => p.id === selectedProjectId);
      if (!projectObject) {
        throw new Error("Selected project not found.");
      }

      const expenseData = {
        description,
        category,
        date,
        amount: amountNumber,
        project: projectObject, // Pass the full Project object
        notes,
        status: 'pending' as 'pending', // Explicitly cast to 'pending'
        userId: user?.id || '', // userIdを追加
      }

      if (selectedExpense) {
        await updateExpense(selectedExpense.id, expenseData)
        toast({
          title: "Expense updated.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addExpense(expenseData)
        toast({
          title: "Expense added.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onClose()
    } catch (err) {
      console.error("Failed to save expense:", err)
      toast({
        title: "Error saving expense.",
        description: err instanceof Error ? err.message : "Could not save expense.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false)
    }
  }
  // --- Modal Submit Logic End ---

  if (isLoading) {
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
        Error loading expenses: {error}
      </Alert>
    )
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Expenses</Heading>
        <Button colorScheme="blue" leftIcon={<MdAdd />} onClick={handleOpenNewModal}>
          New Expense
        </Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search expenses (description, category, project)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </HStack>
      
      {filteredExpenses.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Project</Th>
              <Th isNumeric>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredExpenses.map((expense) => {
              // Use expense.project.name directly
              const projectName = expense.project?.name || 'N/A'

              return (
                <Tr key={expense.id}>
                  <Td>{expense.date && typeof expense.date === 'object' && '_seconds' in expense.date 
                    ? new Date(expense.date._seconds * 1000).toLocaleDateString()
                    : expense.date 
                    ? new Date(expense.date).toLocaleDateString()
                    : 'N/A'}</Td>
                  <Td fontWeight="medium">{expense.description}</Td>
                  <Td>{expense.category}</Td>
                  <Td>{projectName}</Td>
                  <Td isNumeric>${expense.amount.toFixed(2)}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        expense.status === 'approved'
                          ? 'green'
                          : expense.status === 'rejected'
                          ? 'red'
                          : 'yellow'
                      }
                      textTransform="capitalize"
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
                      >
                        <Icon as={MdMoreVert} />
                      </MenuButton>
                      <MenuList>
                        <MenuItem icon={<MdAttachFile />} isDisabled>View Receipt</MenuItem>
                        <MenuItem icon={<MdEdit />} onClick={() => handleOpenEditModal(expense)}>Edit</MenuItem>
                        <MenuItem icon={<MdDelete />} onClick={() => handleDelete(expense.id)}>Delete</MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No expenses found{searchTerm ? ' matching your search' : ''}.</Text>
          <Button mt={4} colorScheme="blue" onClick={handleOpenNewModal}>
            Add your first expense
          </Button>
        </Box>
      )}
      
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedExpense ? 'Edit Expense' : 'Add New Expense'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box as="form" onSubmit={(e: React.FormEvent<HTMLDivElement>) => e.preventDefault()}>
              <FormControl mb={4} isRequired>
                <FormLabel>Description</FormLabel>
                <Input
                  placeholder="Brief description of the expense"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormControl>
              
              <HStack spacing={4} mb={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Category</FormLabel>
                  <Select
                    placeholder="Select category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Meals & Entertainment</option>
                    <option>Transportation</option>
                    <option>Office Supplies</option>
                    <option>Software</option>
                    <option>Hardware</option>
                    <option>Other</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired flex={1}>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </FormControl>
              </HStack>
              
              <HStack spacing={4} mb={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput
                    min={0}
                    precision={2}
                    value={typeof amount === 'number' ? amount.toFixed(2) : amount}
                    onChange={(valueString) => setAmount(valueString)}
                  >
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
                </FormControl>
                
                <FormControl flex={1} isRequired>
                  <FormLabel>Project</FormLabel>
                  <Select
                    placeholder="Select project"
                    value={selectedProjectId} // Use selectedProjectId
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    {projectList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl mb={4}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  placeholder="Additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Upload Receipt</FormLabel>
                <Input type="file" p={1} accept="image/*,.pdf" isDisabled />
              </FormControl>
            </Box>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveExpense}
              isLoading={isSubmitting}
            >
              {selectedExpense ? 'Update Expense' : 'Save Expense'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Expenses
