import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
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
    Spinner,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useDisclosure,
    useToast // Toastを追加
} from '@chakra-ui/react';
import { useState } from 'react'; // Reactをインポート
import { MdAdd, MdDelete, MdEdit, MdMoreVert, MdSearch } from 'react-icons/md';
import ClientModal from '../components/ClientModal';
import { useClients } from '../contexts/ClientContext.js';
import { Client } from '../types/index.js';

const Clients = () => {
  const { clients, isLoading, error, deleteClient } = useClients();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // 編集用クライアント
  const toast = useToast(); // 通知用

  // 検索機能
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 削除処理
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client? This may affect associated projects.')) {
      try {
        await deleteClient(id);
        toast({
          title: "Client deleted.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        console.error("Failed to delete client:", err);
        toast({
          title: "Error deleting client.",
          description: err instanceof Error ? err.message : "Could not delete client.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // 新規作成モーダルを開く
  const handleOpenNewModal = () => {
    setSelectedClient(null); // 編集対象をリセット
    onOpen();
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client); // 編集対象をセット
    onOpen();
  };

  // ローディング表示
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading clients: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Clients</Heading>
        <Button colorScheme="blue" leftIcon={<MdAdd />} onClick={handleOpenNewModal}>
          New Client
        </Button>
      </HStack>

      <HStack mb={6} spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search clients (name, contact, email)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        {/* TODO: Add filtering options (e.g., by status) */}
      </HStack>

      {filteredClients.length > 0 ? (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Contact Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredClients.map((client) => (
              <Tr key={client.id}>
                <Td fontWeight="medium">{client.name}</Td>
                <Td>{client.contactName || 'N/A'}</Td>
                <Td>{client.email || 'N/A'}</Td>
                <Td>{client.phone || 'N/A'}</Td>
                <Td>
                  <Badge colorScheme={client.status === 'active' ? 'green' : 'gray'} textTransform="capitalize">
                    {client.status}
                  </Badge>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton as={Button} variant="ghost" size="sm">
                      <Icon as={MdMoreVert} />
                    </MenuButton>
                    <MenuList>
                      <MenuItem icon={<MdEdit />} onClick={() => handleOpenEditModal(client)}>
                        Edit
                      </MenuItem>
                      <MenuItem icon={<MdDelete />} onClick={() => handleDelete(client.id)}>
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">No clients found{searchTerm ? ' matching your search' : ''}.</Text>
          <Button mt={4} colorScheme="blue" leftIcon={<MdAdd />} onClick={handleOpenNewModal}>
            Add your first client
          </Button>
        </Box>
      )}

      {/* Client Modal */}
      <ClientModal
        isOpen={isOpen}
        onClose={onClose}
        clientToEdit={selectedClient}
      />
    </Box>
  );
};

export default Clients; 