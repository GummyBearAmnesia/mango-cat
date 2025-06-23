import axios from 'axios';

jest.doMock('axios', () => {
  const mockAxiosInstance = {
    defaults: {
      baseURL: 'http://127.0.0.1:8000/',
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        accept: "application/json"
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    create: jest.fn().mockReturnValue(mockAxiosInstance),
  };
});

describe('AxiosInstance', () => {
  test('should create instance with correct configuration', () => {
    const AxiosInstance = require('../pages/AxiosInstance').default;
    
    const axios = require('axios');
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://127.0.0.1:8000/',
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        accept: "application/json"
      }
    });
  });
});