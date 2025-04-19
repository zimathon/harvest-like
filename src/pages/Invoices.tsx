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
  MenuItem
} from '@chakra-ui/react'
import { MdSearch, MdMoreVert, MdVisibility, MdEdit, MdSend } from 'react-icons/md'

const invoicesData = [
  {
    id: 'INV-001',
    client: 'Acme Inc.',
    amount: '$3,500.00',
    date: '2025-04-01',
    dueDate: '2025-05-01',
    status: 'Unpaid'
  },
  {
    id: 'INV-002',
    client: 'TechCorp',
    amount: '$5,200.00',
    date: '2025-03-15',
    dueDate: '2025-04-15',
    status: 'Overdue'
  },
  {
    id: 'INV-003',
    client: 'Global Retail',
    amount: '$1,800.00',
    date: '2025-04-10',
    dueDate: '2025-05-10',
    status: 'Paid'
  }
]

const Invoices = () => {
  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Invoices</Heading>
        <Button colorScheme="blue">New Invoice</Button>
      </HStack>
      
      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search invoices" />
        </InputGroup>
      </HStack>
      
      {invoicesData.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Invoice #</Th>
              <Th>Client</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoicesData.map((invoice) => (
              <Tr key={invoice.id}>
                <Td fontWeight="medium">{invoice.id}</Td>
                <Td>{invoice.client}</Td>
                <Td>{invoice.amount}</Td>
                <Td>{invoice.date}</Td>
                <Td>{invoice.dueDate}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      invoice.status === 'Paid'
                        ? 'green'
                        : invoice.status === 'Overdue'
                        ? 'red'
                        : 'yellow'
                    }
                  >
                    {invoice.status}
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
                      <MenuItem icon={<MdVisibility />}>View</MenuItem>
                      <MenuItem icon={<MdEdit />}>Edit</MenuItem>
                      <MenuItem icon={<MdSend />}>Send</MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No invoices found.</Text>
          <Button mt={4} colorScheme="blue">Create your first invoice</Button>
        </Box>
      )}
    </Box>
  )
}

export default Invoices