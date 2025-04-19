import {
  Box,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Text,
  Card,
  CardBody,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,
  Badge,
  Icon
} from '@chakra-ui/react'
import { MdEditNote, MdDelete, MdAdd } from 'react-icons/md'

const clientsData = [
  {
    id: 1,
    name: 'Acme Inc.',
    contact: 'John Smith',
    email: 'john@acme.com',
    phone: '(555) 123-4567',
    projects: 2,
    status: 'Active'
  },
  {
    id: 2,
    name: 'TechCorp',
    contact: 'Sarah Johnson',
    email: 'sarah@techcorp.com',
    phone: '(555) 987-6543',
    projects: 1,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Global Retail',
    contact: 'Mike Wilson',
    email: 'mike@globalretail.com',
    phone: '(555) 456-7890',
    projects: 1,
    status: 'Inactive'
  }
]

const Manage = () => {
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
            
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Projects</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {clientsData.map((client) => (
                  <Tr key={client.id}>
                    <Td fontWeight="medium">{client.name}</Td>
                    <Td>{client.contact}</Td>
                    <Td>{client.email}</Td>
                    <Td>{client.phone}</Td>
                    <Td>{client.projects}</Td>
                    <Td>
                      <Badge colorScheme={client.status === 'Active' ? 'green' : 'gray'}>
                        {client.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" leftIcon={<MdEditNote />} variant="ghost">
                          Edit
                        </Button>
                        <Button size="sm" leftIcon={<MdDelete />} variant="ghost" colorScheme="red">
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
          
          {/* Tasks Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="medium">Tasks</Text>
                <Button leftIcon={<MdAdd />} colorScheme="blue">
                  New Task
                </Button>
              </HStack>
              
              <Text>
                Define tasks that can be selected when tracking time in your projects.
              </Text>
              
              <Card>
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Task Name</Th>
                        <Th>Default Rate</Th>
                        <Th>Billable</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Design</Td>
                        <Td>$100.00 / hour</Td>
                        <Td>Yes</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="sm" leftIcon={<MdEditNote />} variant="ghost">
                              Edit
                            </Button>
                            <Button size="sm" leftIcon={<MdDelete />} variant="ghost" colorScheme="red">
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Development</Td>
                        <Td>$125.00 / hour</Td>
                        <Td>Yes</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="sm" leftIcon={<MdEditNote />} variant="ghost">
                              Edit
                            </Button>
                            <Button size="sm" leftIcon={<MdDelete />} variant="ghost" colorScheme="red">
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Meeting</Td>
                        <Td>$75.00 / hour</Td>
                        <Td>Yes</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="sm" leftIcon={<MdEditNote />} variant="ghost">
                              Edit
                            </Button>
                            <Button size="sm" leftIcon={<MdDelete />} variant="ghost" colorScheme="red">
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
          
          {/* Account Settings Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Text fontSize="xl" fontWeight="medium">Account Settings</Text>
              
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" mb={2}>Company Information</Heading>
                    
                    <FormControl>
                      <FormLabel>Company Name</FormLabel>
                      <Input defaultValue="Your Company" />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Address</FormLabel>
                      <Textarea defaultValue="123 Main Street, City, State, ZIP" />
                    </FormControl>
                    
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input defaultValue="contact@yourcompany.com" />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Phone</FormLabel>
                        <Input defaultValue="(555) 123-4567" />
                      </FormControl>
                    </HStack>
                    
                    <Heading size="md" mt={4} mb={2}>Preferences</Heading>
                    
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel>Default Currency</FormLabel>
                        <Select defaultValue="usd">
                          <option value="usd">USD ($)</option>
                          <option value="eur">EUR (€)</option>
                          <option value="gbp">GBP (£)</option>
                          <option value="jpy">JPY (¥)</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Date Format</FormLabel>
                        <Select defaultValue="mdy">
                          <option value="mdy">MM/DD/YYYY</option>
                          <option value="dmy">DD/MM/YYYY</option>
                          <option value="ymd">YYYY/MM/DD</option>
                        </Select>
                      </FormControl>
                    </HStack>
                    
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel>Time Format</FormLabel>
                        <Select defaultValue="12h">
                          <option value="12h">12-hour</option>
                          <option value="24h">24-hour</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>First Day of Week</FormLabel>
                        <Select defaultValue="sunday">
                          <option value="sunday">Sunday</option>
                          <option value="monday">Monday</option>
                        </Select>
                      </FormControl>
                    </HStack>
                    
                    <FormControl display="flex" alignItems="center" mt={2}>
                      <FormLabel mb="0">
                        Track time in decimal format
                      </FormLabel>
                      <Switch colorScheme="blue" defaultChecked />
                    </FormControl>
                    
                    <Button colorScheme="blue" mt={4} alignSelf="flex-start">
                      Save Changes
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
          
          {/* Team Members Tab */}
          <TabPanel>
            <Text>Team members management settings would appear here.</Text>
          </TabPanel>
          
          {/* Integrations Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Text fontSize="xl" fontWeight="medium">Integrations</Text>
              
              <Card>
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="md">QuickBooks</Heading>
                        <Text color="gray.600">Sync invoices, expenses, and clients with QuickBooks</Text>
                      </Box>
                      <Button colorScheme="gray">Connect</Button>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="md">Slack</Heading>
                        <Text color="gray.600">Send time and expense reminders to your team via Slack</Text>
                      </Box>
                      <Button colorScheme="gray">Connect</Button>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="md">Asana</Heading>
                        <Text color="gray.600">Import projects and tasks from Asana</Text>
                      </Box>
                      <Button colorScheme="gray">Connect</Button>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Box>
                        <Heading size="md">GitHub</Heading>
                        <Text color="gray.600">Connect projects with GitHub repositories</Text>
                      </Box>
                      <Button colorScheme="gray">Connect</Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default Manage