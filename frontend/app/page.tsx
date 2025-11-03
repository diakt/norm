'use client';

import { useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
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
const PDF_URL = `${API_BASE_URL}/static/laws.pdf`;

export default function Page(): React.ReactNode {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) {
      setError('Enter a question to search the knowledge base.');
      return;
    }

    setIsViewerOpen(false);
    setActiveCitation(null);
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

  const handleCitationClick = (citation: Citation) => {
    setActiveCitation(citation);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setActiveCitation(null);
  };

  const containerMaxWidth = isViewerOpen ? '6xl' : '4xl';
  const leftColumnFlexProps = isViewerOpen
    ? { flex: { base: '1', xl: '0 0 50%' }, maxW: '100%', mx: 0 }
    : { flex: '1', maxW: '720px', mx: 'auto' };

  return (
    <Box bg="#F5F5F8" minH="100vh">
      <HeaderNav signOut={() => {}} />
      <Container maxW={containerMaxWidth} py={10}>
        <Flex
          direction={{ base: 'column', xl: 'row' }}
          align="stretch"
          gap={8}
          justify={isViewerOpen ? 'space-between' : 'center'}
        >
          <Box
            {...leftColumnFlexProps}
            minW={0}
          >
            <Stack spacing={8}>
              <Box>
                <Heading size="lg">Ask the Council</Heading>
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
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                      >
                        Query
                      </Text>
                      <Text fontSize="lg">{result.query}</Text>
                    </Box>

                    <Box>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                      >
                        Answer
                      </Text>
                      <Text fontSize="lg">
                        {result.response ||
                          'The service did not return an answer.'}
                      </Text>
                    </Box>

                    <Box>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        textTransform="uppercase"
                      >
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
                              <Stack
                                direction="row"
                                justify="space-between"
                                align="flex-start"
                                spacing={3}
                              >
                                <Box>
                                  <Text fontWeight="semibold" mb={1}>
                                    {citation.source ||
                                      `Citation ${index + 1}`}
                                  </Text>
                                  <Text color="gray.700">
                                    {citation.text}
                                  </Text>
                                </Box>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorScheme="purple"
                                  onClick={() => handleCitationClick(citation)}
                                >
                                  View PDF
                                </Button>
                              </Stack>
                            </Box>
                          ))
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>

          {isViewerOpen && (
            <Box
              flex={{ base: '1', xl: '0 0 50%' }}
              bg="white"
              p={6}
              borderRadius="md"
              boxShadow="sm"
              minH={{ base: '60vh', xl: '70vh' }}
            >
              <Stack spacing={4} h="100%">
                <Box>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="md">Source PDF</Heading>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseViewer}
                    >
                      Close
                    </Button>
                  </Flex>
                  
                </Box>
                <Box flex="1" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
                  <Box
                    as="iframe"
                    src={PDF_URL}
                    width="100%"
                    height="100%"
                    style={{ minHeight: '100%' }}
                    title="Source document"
                  />
                </Box>
              </Stack>
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
