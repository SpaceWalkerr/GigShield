import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

// Mock the language utils
vi.mock("../utils/siteLanguage.jsx", () => ({
  useSiteLanguage: () => ({
    languageMode: "en",
    setLanguageMode: vi.fn(),
  }),
}));

vi.mock("../utils/i18n", () => ({
  selectLabel: (_lang, eng) => eng,
}));

describe("LandingPage Component", () => {
  it("renders the current hero headline", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(
      screen.getByText(/Weekly income protection for every disrupted delivery shift\./)
    ).toBeDefined();
  });

  it("renders the protection description copy", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(
      screen.getByText(/GigShield is a weekly income protection product for delivery workers\./)
    ).toBeDefined();
  });

  it("renders the weekly pricing card", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/₹79 to ₹179/)).toBeDefined();
    expect(screen.getByText(/Income Loss Only/)).toBeDefined();
  });

  it("renders the current call-to-action buttons", () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/See How It Works/)).toBeDefined();
    expect(screen.getByText(/View Weekly Plans/)).toBeDefined();
  });
});

