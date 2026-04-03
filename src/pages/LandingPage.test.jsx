import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

// Mock the language utils
vi.mock("../utils/siteLanguage", () => ({
  useSiteLanguage: () => ({
    languageMode: "en",
    setLanguageMode: vi.fn(),
  }),
}));

vi.mock("../utils/i18n", () => ({
  selectLabel: (lang, eng, hindi) => eng,
}));

describe("LandingPage Component", () => {
  it("renders the main GigShield brand logo", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/GIGSHIELD\./)).toBeDefined();
  });

  it("renders the marquee with payout text", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(screen.getAllByText(/Ramesh Kumar received ₹30 payback/)[0]).toBeDefined();
  });

  it("renders the main hero text overlapping", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Protect income\./)).toBeDefined();
    expect(screen.getByText(/Ride through every disruption\./)).toBeDefined();
  });

  it("renders the call to action buttons", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    const getProtectedBtns = screen.getAllByText(/Get Protected/);
    expect(getProtectedBtns.length).toBeGreaterThan(0);
    const signInBtns = screen.getAllByText(/Sign In/);
    expect(signInBtns.length).toBeGreaterThan(0);
  });
});
