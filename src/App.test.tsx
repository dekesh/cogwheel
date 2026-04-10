import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';

import { App } from './App';
import { theme } from './theme';

describe('App', () => {
  it('renders the initial workspace shell', () => {
    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>,
    );

    expect(screen.getByText('Cogwheel Designer')).toBeDefined();
    expect(screen.getByText(/Design canvas/i)).toBeDefined();
    expect(screen.getByText(/Inspector/i)).toBeDefined();
    expect(screen.getByLabelText(/Driver gear preview/i)).toBeDefined();
  });

  it('adds a new gear from the sidebar', () => {
    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add gear' }));

    expect(screen.getAllByText('Gear 3').length).toBeGreaterThan(0);
  });

  it('removes the selected gear from the inspector', () => {
    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove gear' }));

    expect(screen.queryByText('Driver gear')).toBeNull();
  });

  it('updates selected gear values from the inspector', () => {
    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Edited driver' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Teeth' }), {
      target: { value: '28' },
    });

    expect(screen.getAllByText('Edited driver').length).toBeGreaterThan(0);
    expect(screen.getByText('Teeth: 28')).toBeDefined();
  });

  it('exports the selected gear as an SVG document', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: () => 'blob:gear',
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: () => undefined,
    });

    const createObjectUrlMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:gear');
    const revokeObjectUrlMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export selected SVG' }));

    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createObjectUrlMock.mockRestore();
    revokeObjectUrlMock.mockRestore();
    clickSpy.mockRestore();
  });
});
