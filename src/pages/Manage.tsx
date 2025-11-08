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
  Radio,
  RadioGroup,
  Spinner,
  Stack,
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
  Tr,
  VStack
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdEditNote } from 'react-icons/md';
import { useClients } from '../contexts/ClientContext.js';
import { useSettings } from '../contexts/SettingsContext';

const Manage = () => {
  const { clients, isLoading, error } = useClients();
  const { timeFormat, setTimeFormat } = useSettings();

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
            <VStack align="stretch" spacing={6}>
              <Box>
                <Heading size="md" mb={4}>Account Settings</Heading>

                <FormControl>
                  <FormLabel fontSize="lg" fontWeight="semibold" mb={3}>
                    Time Display Format
                  </FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Choose how time durations are displayed throughout the application.
                  </Text>

                  <RadioGroup
                    value={timeFormat}
                    onChange={(value) => setTimeFormat(value as 'decimal' | 'hhmm')}
                  >
                    <Stack spacing={4}>
                      <Radio value="hhmm">
                        <Box>
                          <Text fontWeight="medium">Hours and Minutes</Text>
                          <Text fontSize="sm" color="gray.600">
                            Display time as "2h 30m"
                          </Text>
                        </Box>
                      </Radio>
                      <Radio value="decimal">
                        <Box>
                          <Text fontWeight="medium">Decimal Hours</Text>
                          <Text fontSize="sm" color="gray.600">
                            Display time as "2.5"
                          </Text>
                        </Box>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
              </Box>
            </VStack>
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