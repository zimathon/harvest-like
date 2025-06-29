import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Select,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useClients } from '../contexts/ClientContext';
import { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit: Client | null;
}

const ClientModal = ({ isOpen, onClose, clientToEdit }: ClientModalProps) => {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isLoading, setIsLoading] = useState(false);

  const { addClient, updateClient } = useClients();
  const toast = useToast();

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setContactName(clientToEdit.contactName || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
      setAddress(clientToEdit.address || '');
      setStatus(clientToEdit.status);
    } else {
      // Reset form for new client
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setStatus('active');
    }
  }, [clientToEdit, isOpen]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const clientData = { name, contactName, email, phone, address, status };
      if (clientToEdit) {
        await updateClient(clientToEdit.id, clientData);
        toast({
          title: 'Client updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addClient(clientData);
        toast({
          title: 'Client created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error saving client.',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{clientToEdit ? 'Edit Client' : 'Create New Client'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Client Name</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Contact Name</FormLabel>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Phone</FormLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Address</FormLabel>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} mr={3}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            {clientToEdit ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClientModal;