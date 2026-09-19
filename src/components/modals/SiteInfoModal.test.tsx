import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteInfoModal } from './SiteInfoModal';

describe('SiteInfoModal', () => {
  it('renders help content and switches to about without navigation', () => {
    const onKindChange = vi.fn();
    const onClose = vi.fn();

    render(
      <SiteInfoModal kind="help" onKindChange={onKindChange} onClose={onClose} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Как работать в Плитка PDF' })).toBeInTheDocument();
    expect(screen.getByLabelText('Вопросы и ответы')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'О сервисе' }));
    expect(onKindChange).toHaveBeenCalledWith('about');
  });

  it('closes on backdrop click and Escape', () => {
    const onClose = vi.fn();

    const { container } = render(
      <SiteInfoModal kind="about" onKindChange={vi.fn()} onClose={onClose} />
    );

    expect(screen.getByRole('heading', { name: /Плитка PDF — сервис/ })).toBeInTheDocument();

    fireEvent.mouseDown(container.querySelector('.site-info-modal-backdrop')!);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
