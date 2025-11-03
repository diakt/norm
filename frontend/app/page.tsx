'use client';

import { useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';

import HeaderNav from '@/components/HeaderNav';

interface Citation {
  source: string;
  text: string;
}

interface QueryResponse {
  query: string;
  response: string;
  citations: Citation[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export default function Page(): React.ReactNode {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) {
      setError('Enter a question to search the knowledge base.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/query?q=${encodeURIComponent(trimmed)}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as QueryResponse;
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while querying the service.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg="#F5F5F8" minH="100vh">
      <HeaderNav signOut={() => {}} />
      <Container maxW="4xl" py={10}>
        <Stack spacing={8}>
          <Box>
            <Heading size="lg" mb={2}>
              Ask the Council
            </Heading>
            <Button
              mt={4}
              variant="outline"
              colorScheme="purple"
              isDisabled
              cursor="not-allowed"
              alignSelf="flex-end"
            >
              Upload &amp; Manage Documentation
            </Button>
          </Box>

          <Box
            as="form"
            onSubmit={handleSubmit}
            bg="white"
            p={6}
            borderRadius="md"
            boxShadow="sm"
          >
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontWeight="semibold">
                  What would you like to know?
                </FormLabel>
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="e.g. What happens if I steal from the Sept?"
                  size="lg"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                alignSelf="flex-start"
                isLoading={isLoading}
              >
                Search
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {result && (
            <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" textTransform="uppercase">
                    Query
                  </Text>
                  <Text fontSize="lg">{result.query}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" textTransform="uppercase">
                    Answer
                  </Text>
                  <Text fontSize="lg">
                    {result.response || 'The service did not return an answer.'}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" textTransform="uppercase">
                    Citations
                  </Text>
                  <Stack spacing={3} mt={2}>
                    {result.citations.length === 0 ? (
                      <Text color="gray.500">No citations returned.</Text>
                    ) : (
                      result.citations.map((citation, index) => (
                        <Box
                          key={`${citation.source}-${index}`}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          p={3}
                          bg="gray.50"
                        >
                          <Text fontWeight="semibold" mb={1}>
                            {citation.source || `Citation ${index + 1}`}
                          </Text>
                          <Text color="gray.700">{citation.text}</Text>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
