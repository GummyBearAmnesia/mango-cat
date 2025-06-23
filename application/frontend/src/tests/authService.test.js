import axios from "axios";
import {
    isTokenExpired,
    refreshToken,
    getAuthenticatedRequest,
} from "../utils/authService";
import { jwtDecode } from "jwt-decode";

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem");
    jest.spyOn(Storage.prototype, "setItem");
    jest.spyOn(Storage.prototype, "removeItem");

    delete window.location;
    window.location = { href: "" };
});


jest.mock("jwt-decode", () => ({
    jwtDecode: jest.fn(),
}));

jest.mock("axios");

describe("Auth Service Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        jest.spyOn(Storage.prototype, "getItem");
        jest.spyOn(Storage.prototype, "setItem");
        jest.spyOn(Storage.prototype, "removeItem");

        delete window.location;
        window.location = { href: "" };
        axios.mockReset();
    });

    test("isTokenExpired should return true for expired tokens", () => {
        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 - 60 });
        expect(isTokenExpired("fake_token")).toBe(true);
    });

    test("isTokenExpired should return false for valid tokens", () => {
        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });
        expect(isTokenExpired("valid_token")).toBe(false);
    });

    test("refreshToken should return new access token on success", async () => {
        localStorage.getItem.mockImplementation((key) =>
            key === "refresh_token" ? "valid_refresh_token" : null
        );

        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });

        axios.post.mockResolvedValue({
            data: { access: "new_access_token", refresh: "new_refresh_token" },
        });

        const newToken = await refreshToken();
        expect(newToken).toBe("new_access_token");
        expect(localStorage.setItem).toHaveBeenCalledWith("access_token", "new_access_token");
        expect(localStorage.setItem).toHaveBeenCalledWith("refresh_token", "new_refresh_token");
    });

    test("refreshToken should logout user if refresh token is expired", async () => {
        localStorage.getItem.mockImplementation(() => "expired_refresh_token");
        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 - 600 });

        await refreshToken();
        expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
        expect(localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
        expect(window.location.href).toBe("/login");
    });

    test("refreshToken should logout on API failure", async () => {
        localStorage.getItem.mockImplementation(() => "valid_refresh_token");
        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });

        axios.post.mockRejectedValue({ response: { status: 401 } });

        await refreshToken();
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
        expect(window.location.href).toBe("/login");
    });

    test("getAuthenticatedRequest should fetch data when token is valid", async () => {
        localStorage.getItem.mockImplementation((key) => (key === "access_token" ? "valid_token" : null));
        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });

        axios.mockResolvedValue({ data: { message: "success" } });

        const data = await getAuthenticatedRequest("/test");
        expect(data).toEqual({ message: "success" });
        expect(axios).toHaveBeenCalledWith({
            method: "GET",
            url: "http://127.0.0.1:8000/api/test",
            headers: { Authorization: "Bearer valid_token" },
            data: null,
        });
    });

    test("getAuthenticatedRequest should refresh token if expired", async () => {
        localStorage.getItem.mockImplementation((key) =>
            key === "access_token" ? "expired_token" : "valid_refresh_token"
        );

        jwtDecode.mockImplementation((token) =>
            token === "expired_token" ? { exp: Date.now() / 1000 - 60 } : { exp: Date.now() / 1000 + 600 }
        );

        axios.post.mockResolvedValue({ data: { access: "new_access_token" } });
        axios.mockResolvedValue({ data: { message: "success" } });

        const data = await getAuthenticatedRequest("/test");
        expect(data).toEqual({ message: "success" });
        expect(localStorage.setItem).toHaveBeenCalledWith("access_token", "new_access_token");
    });

    test("getAuthenticatedRequest should handle request errors and logout on 401", async () => {
        localStorage.getItem.mockImplementation((key) => (key === "access_token" ? "valid_token" : null));

        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });

        axios.mockRejectedValueOnce({
            response: {
                status: 401,
                data: { message: "Unauthorized" },
            },
        });

        await expect(getAuthenticatedRequest("/test")).rejects.toEqual({
            response: {
                status: 401,
                data: { message: "Unauthorized" },
            },
        });

        expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
        expect(localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
        expect(window.location.href).toBe("/login");
    });

    test("getAuthenticatedRequest should throw error if refreshToken fails", async () => {
        localStorage.getItem.mockImplementation((key) =>
            key === "access_token" ? "expired_token" : "valid_refresh_token"
        );

        jwtDecode.mockImplementation((token) =>
            token === "expired_token" ? { exp: Date.now() / 1000 - 60 } : { exp: Date.now() / 1000 + 600 }
        );

        axios.post.mockRejectedValue({ response: { status: 401 } });

        await expect(getAuthenticatedRequest("/test")).rejects.toThrow("Authentication failed, please log in again.");
        expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
        expect(localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
        expect(window.location.href).toBe("/login");
    });

    test("isTokenExpired should return true for missing tokens", () => {
        expect(isTokenExpired(null)).toBe(true);
    });

    test("refreshToken should logout user if refresh token is missing or expired", async () => {
        localStorage.getItem.mockImplementation(() => null);

        await refreshToken();
        expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
        expect(localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
        expect(window.location.href).toBe("/login");

        jest.clearAllMocks();

        localStorage.getItem.mockImplementation(() => "expired_refresh_token");
        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 - 600 });

        await refreshToken();
        expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
        expect(localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
        expect(window.location.href).toBe("/login");
    });

    test("refreshToken should handle case where no new refresh token is returned", async () => {
        localStorage.getItem.mockImplementation((key) =>
            key === "refresh_token" ? "valid_refresh_token" : null
        );

        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });

        axios.post.mockResolvedValue({
            data: { access: "new_access_token" },
        });

        const newToken = await refreshToken();
        expect(newToken).toBe("new_access_token");
        expect(localStorage.setItem).toHaveBeenCalledWith("access_token", "new_access_token");
        expect(localStorage.setItem).not.toHaveBeenCalledWith("refresh_token", expect.anything());
    });

    test("getAuthenticatedRequest should not logout on non-401 errors", async () => {
        
        localStorage.getItem.mockImplementation((key) => (key === "access_token" ? "valid_token" : null));

        jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 600 });

        axios.mockRejectedValueOnce({
            response: {
                status: 500,
                data: { message: "Server Error" },
            },
        });

        await expect(getAuthenticatedRequest("/test")).rejects.toEqual({
            response: {
                status: 500,
                data: { message: "Server Error" },
            },
        });

        expect(localStorage.removeItem).not.toHaveBeenCalled();
        expect(window.location.href).not.toBe("/login");
    });

});
