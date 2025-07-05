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
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { MdSearch, MdMoreVert, MdVisibility, MdEdit, MdSend } from 'react-icons/md'
import { useInvoices } from '../contexts/InvoiceContext'

const Invoices = () => {
  const { invoices, isLoading, error } = useInvoices();

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
        Error loading invoices: {error}
      </Alert>
    );
  }

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
      
      {invoices.length > 0 ? (
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
            {invoices.map((invoice) => (
              <Tr key={invoice.id}>
                <Td fontWeight="medium">{invoice.number}</Td>
                <Td>{invoice.clientId}</Td> {/* Assuming clientId is displayed for now */}
                <Td>${invoice.amount.toFixed(2)}</Td>
                <Td>{new Date(invoice.issueDate).toLocaleDateString()}</Td>
                <Td>{new Date(invoice.dueDate).toLocaleDateString()}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      invoice.status === 'paid'
                        ? 'green'
                        : invoice.status === 'overdue'
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