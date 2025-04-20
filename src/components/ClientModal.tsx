import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Textarea,
    useToast, // Toast をインポート
    VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react'; // React をインポート
import { useClients } from '../contexts/ClientContext.js';
import { Client } from '../types/index.js';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit: Client | null; // 編集対象のクライアント (nullなら新規作成)
}

const ClientModal = ({ isOpen, onClose, clientToEdit }: ClientModalProps) => {
  const { addClient, updateClient } = useClients();
  const toast = useToast(); // 通知用

  // Form state
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合、フォームに初期値をセット
  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setContactName(clientToEdit.contactName || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
      setAddress(clientToEdit.address || '');
      setStatus(clientToEdit.status);
    } else {
      // 新規作成モードの場合はフォームをリセット
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setStatus('active');
    }
  }, [clientToEdit, isOpen]); // isOpen も依存配列に追加し、モーダルが開くたびに初期化

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Client name is required.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setIsSubmitting(true);

    const clientData = {
      name,
      contactName: contactName || undefined, // 空文字は undefined に
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      status,
    };

    try {
      if (clientToEdit) {
        // 更新処理
        await updateClient(clientToEdit.id, clientData);
        toast({ title: "Client updated successfully.", status: "success" });
      } else {
        // 新規作成処理
        await addClient(clientData);
        toast({ title: "Client added successfully.", status: "success" });
      }
      onClose(); // モーダルを閉じる
    } catch (error) {
      console.error("Failed to save client:", error);
      toast({
        title: `Error ${clientToEdit ? 'updating' : 'adding'} client.`,
        description: error instanceof Error ? error.message : "Could not save client.",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{clientToEdit ? 'Edit Client' : 'Add New Client'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box as="form" id="client-form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Client Name</FormLabel>
                <Input
                  placeholder="Enter client name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Contact Name</FormLabel>
                <Input
                  placeholder="Contact person (optional)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="client@example.com (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  placeholder="Phone number (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  placeholder="Client address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormControl>
            </VStack>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            type="submit" // form の submit をトリガー
            form="client-form" // フォームとボタンを関連付け
            isLoading={isSubmitting}
          >
            {clientToEdit ? 'Save Changes' : 'Add Client'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClientModal; 