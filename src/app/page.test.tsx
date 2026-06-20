import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import Home from './page';
import { ToastProvider } from '@/components/toast/toast-provider';
import { PreferencesProvider } from '@/lib/preferences';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <PreferencesProvider>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </PreferencesProvider>
  );
};

describe('Home', () => {
  it('renders TalentTrust heading', () => {
    renderWithProviders(<Home />);
    expect(screen.getByRole('heading', { name: /TalentTrust/i })).toBeInTheDocument();
  });

  it('renders description paragraph', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Decentralized Freelancer Escrow Protocol/i)).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    const { container } = renderWithProviders(<Home />);
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(container.querySelector('h1')).toBeInTheDocument();
  });

  it('displays validation errors on empty submission', () => {
    renderWithProviders(<Home />);
    
    // Submit form empty
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Check that ErrorSummary and error messages are rendered
    expect(screen.getByRole('alert', { name: /There is a problem/i })).toBeInTheDocument();
    expect(screen.getAllByText('Email is required')).toHaveLength(2);
    expect(screen.getAllByText('Password is required')).toHaveLength(2);
  });

  it('displays specific validation error for invalid email and short password', () => {
    renderWithProviders(<Home />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(screen.getAllByText('Email must be valid')).toHaveLength(2);
    expect(screen.getAllByText('Password must be at least 8 characters')).toHaveLength(2);
  });

  it('shows success toast on valid submission', () => {
    renderWithProviders(<Home />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Check that toast notification is triggered and rendered in ToastViewport
    expect(screen.getByRole('status')).toHaveTextContent('Form submitted successfully!');
  });

  it('has no accessibility violations on render', async () => {
    const { container } = renderWithProviders(<Home />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('focuses the error summary when errors appear', () => {
    renderWithProviders(<Home />);
    
    // Submit form empty to trigger errors
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    const errorSummary = screen.getByRole('alert', { name: /There is a problem/i });
    expect(errorSummary).toBeInTheDocument();
    
    // The ErrorSummary element should have received focus via ref
    expect(errorSummary).toHaveFocus();
  });

  it('has inputs that are properly labelled and described by error elements when errors occur', () => {
    renderWithProviders(<Home />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    // Trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Check aria-describedby and aria-invalid on inputs
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');

    const emailError = screen.getAllByText('Email is required').find(
      (el) => el.id === 'email-error'
    );
    expect(emailError).toBeInTheDocument();

    expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');

    const passwordError = screen.getAllByText('Password is required').find(
      (el) => el.id === 'password-error'
    );
    expect(passwordError).toBeInTheDocument();
  });
});


