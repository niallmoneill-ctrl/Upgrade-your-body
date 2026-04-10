import { render, screen, fireEvent } from '@testing-library/react';
import PricingPage from '../../../../app/pricing/page';

describe('PricingPage', () => {
  it('renders all pricing tiers', () => {
    render(<PricingPage />);
    expect(screen.getByText('PDF eBook')).toBeInTheDocument();
    expect(screen.getByText('Pro Monthly')).toBeInTheDocument();
    expect(screen.getByText('Bundle')).toBeInTheDocument();
    expect(screen.getByText('Pro Annual')).toBeInTheDocument();
  });

  it('shows the correct CTA buttons', () => {
    render(<PricingPage />);
    expect(screen.getByText('Get the eBook')).toBeInTheDocument();
    expect(screen.getByText('Start Pro')).toBeInTheDocument();
    expect(screen.getByText('Get the Bundle')).toBeInTheDocument();
    expect(screen.getByText('Go Annual')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<PricingPage />);
    const button = screen.getByText('Get the eBook');
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });
});
