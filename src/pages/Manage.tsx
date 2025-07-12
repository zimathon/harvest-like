import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdEditNote } from 'react-icons/md';
import { useClients } from '../contexts/ClientContext.js';

const Manage = () => {
  const { clients, isLoading, error } = useClients();

  const handleDelete = (id: string) => {
    console.log(`Delete client ${id}`);
    // TODO: Implement delete functionality
  };

  return (
    <Box>
      <Heading mb={6}>Manage</Heading>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Clients</Tab>
          <Tab>Tasks</Tab>
          <Tab>Account Settings</Tab>
          <Tab>Team Members</Tab>
          <Tab>Integrations</Tab>
        </TabList>

        <TabPanels>
          {/* Clients Tab */}
          <TabPanel>
            <HStack justify="space-between" mb={4}>
              <Text fontSize="xl" fontWeight="medium">Clients</Text>
              <Button leftIcon={<MdAdd />} colorScheme="blue">
                New Client
              </Button>
            </HStack>

            {isLoading && (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Spinner size="xl" />
              </Box>
            )}

            {error && (
              <Alert status="error">
                <AlertIcon />
                Error loading clients: {error}
              </Alert>
            )}

            {!isLoading && !error && (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Contact</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {clients.map((client) => (
                    <Tr key={client.id}>
                      <Td fontWeight="medium">{client.name}</Td>
                      <Td>{client.contactName || 'N/A'}</Td>
                      <Td>{client.email || 'N/A'}</Td>
                      <Td>{client.phone || 'N/A'}</Td>
                      <Td>
                        <Badge colorScheme={client.status === 'active' ? 'green' : 'gray'}>
                          {client.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button size="sm" leftIcon={<MdEditNote />} variant="ghost">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<MdDelete />}
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(client.id)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TabPanel>

          {/* Other Tabs as Placeholders */}
          <TabPanel>
            <Text>Task management settings will be available here.</Text>
          </TabPanel>
          <TabPanel>
            <Text>Account-wide settings will be available here.</Text>
          </TabPanel>
          <TabPanel>
            <Text>Team member management will be available here.</Text>
          </TabPanel>
          <TabPanel>
            <Text>Integrations with other services will be configured here.</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Manage;