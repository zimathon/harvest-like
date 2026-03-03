import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  InputGroup,
  InputRightElement,
  Icon,
  Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      navigate('/time');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" alignItems="center" justifyContent="center" bg="gray.50" px={{ base: 4, md: 0 }}>
      <Container maxW="md" p={{ base: 6, md: 8 }} bg="white" borderRadius="md" boxShadow="md" w="full">
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading mb={2} size={{ base: 'lg', md: 'xl' }}>Harvest-like</Heading>
            <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>Sign in to your account</Text>
          </Box>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  size={{ base: 'lg', md: 'md' }}
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </FormControl>

              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup size={{ base: 'lg', md: 'md' }}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <InputRightElement h="full">
                    <Button
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      size="sm"
                    >
                      <Icon
                        as={showPassword ? MdVisibilityOff : MdVisibility}
                        color="gray.500"
                      />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                colorScheme="blue"
                width="full"
                mt={4}
                type="submit"
                isLoading={isLoading}
                size="lg"
                h={{ base: '52px', md: '44px' }}
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <Text fontSize="sm" textAlign="center" color="gray.600">
            For demo purposes, you can use any email and password
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
};

export default Login;