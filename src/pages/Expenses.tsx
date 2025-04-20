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
  useDisclosure
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { MdAdd, MdAttachFile, MdDelete, MdEdit, MdMoreVert, MdSearch } from 'react-icons/md'
import { useExpenses } from '../contexts/ExpenseContext.js'
import { useProjects } from '../contexts/ProjectContext.js'

const Expenses = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { expenses, isLoading, error, fetchExpenses, deleteExpense, addExpense } = useExpenses()
  const { projects: projectList } = useProjects()
  const [searchTerm, setSearchTerm] = useState('')

  // --- Modal State ---
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState<number | string>('')
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // --- Modal State End ---

  useEffect(() => {
    // fetchExpenses(); // Context側で user 依存で実行されているため、通常は不要
  }, [fetchExpenses])

  const filteredExpenses = expenses.filter(expense => {
    const project = projectList.find(p => p.id === expense.projectId)
    const projectName = project?.name || ''
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
        // 必要に応じて成功通知
      } catch (err) {
        // 必要に応じてエラー通知
        console.error("Failed to delete expense:", err)
      }
    }
  }

  // --- Modal Submit Logic ---
  const handleSaveExpense = async () => {
    if (!description || !category || !date || !amount || !projectId) {
      alert('Please fill in all required fields, including Project.')
      return
    }

    setIsSubmitting(true)
    try {
      const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount
      if (isNaN(amountNumber)) {
        throw new Error("Invalid Amount")
      }

      await addExpense({
        description,
        category,
        date,
        amount: amountNumber,
        project: projectId,
        notes,
        status: 'pending'
      })
      onClose()
      setDescription('')
      setCategory('')
      setDate('')
      setAmount('')
      setProjectId('')
      setNotes('')
    } catch (err) {
      console.error("Failed to save expense:", err)
      alert(`Error saving expense: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
        <Button colorScheme="blue" leftIcon={<MdAdd />} onClick={onOpen}>
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
              const project = projectList.find(p => p.id === expense.projectId)
              const projectName = project?.name || 'N/A'

              return (
                <Tr key={expense.id}>
                  <Td>{new Date(expense.date).toLocaleDateString()}</Td>
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
                        <MenuItem icon={<MdEdit />} onClick={() => console.log("Edit", expense.id)}>Edit</MenuItem>
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
          <Button mt={4} colorScheme="blue" onClick={onOpen}>
            Add your first expense
          </Button>
        </Box>
      )}
      
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Expense</ModalHeader>
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
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
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
              Save Expense
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Expenses