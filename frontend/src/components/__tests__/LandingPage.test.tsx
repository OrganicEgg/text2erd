import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../LandingPage';

describe('LandingPage component', () => {
  it('renders headline, features, and launch buttons', () => {
    const handleLaunch = vi.fn();
    render(<LandingPage onLaunchApp={handleLaunch} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Draft database tables in/i);
    expect(screen.getAllByText(/plain text/i).length).toBeGreaterThan(0);

    const launchButtons = screen.getAllByRole('button', { name: /studio/i });
    expect(launchButtons.length).toBeGreaterThan(0);

    fireEvent.click(launchButtons[0]);
    expect(handleLaunch).toHaveBeenCalled();
  });

  it('contains zero github links or repository mentions', () => {
    const { container } = render(<LandingPage onLaunchApp={vi.fn()} />);
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      expect(href.toLowerCase()).not.toContain('github');
    });
    expect(container.innerHTML.toLowerCase()).not.toContain('github');
  });

  it('displays accurate, grounded free-tier copy without overselling', () => {
    render(<LandingPage onLaunchApp={vi.fn()} />);
    expect(screen.getByText(/Free Web Tool/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Free to Use/i)).toBeInTheDocument();
    expect(screen.getByText(/No Account or Login Required/i)).toBeInTheDocument();
  });
});
