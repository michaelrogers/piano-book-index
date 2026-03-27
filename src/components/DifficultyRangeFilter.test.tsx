import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import DifficultyRangeFilter, { DIFFICULTY_LABELS } from '../components/DifficultyRangeFilter';

describe('DIFFICULTY_LABELS', () => {
  it('contains 6 difficulty levels', () => {
    expect(DIFFICULTY_LABELS).toHaveLength(6);
  });

  it('lists labels in order from easiest to hardest', () => {
    expect(DIFFICULTY_LABELS).toEqual([
      'Beginner',
      'Early Intermediate',
      'Intermediate',
      'Late Intermediate',
      'Early Advanced',
      'Advanced',
    ]);
  });
});

describe('DifficultyRangeFilter component', () => {
  it('renders 6 segment buttons', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={null} max={null} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    expect(buttons).toHaveLength(6);
  });

  it('all segments are unpressed when no selection', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={null} max={null} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed="true"]');
    expect(buttons).toHaveLength(0);
  });

  it('clicking a segment selects it', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={null} max={null} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    await fireEvent.click(buttons[2]); // Intermediate
    expect(onChange).toHaveBeenCalledWith(2, 2);
  });

  it('clicking the only selected segment clears it', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={2} max={2} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    await fireEvent.click(buttons[2]);
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it('clicking outside the range extends it', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={2} max={3} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    await fireEvent.click(buttons[5]); // Advanced
    expect(onChange).toHaveBeenCalledWith(2, 5);
  });

  it('clicking the min end shrinks from left', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={1} max={4} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    await fireEvent.click(buttons[1]); // min end
    expect(onChange).toHaveBeenCalledWith(2, 4);
  });

  it('clicking the max end shrinks from right', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={1} max={4} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    await fireEvent.click(buttons[4]); // max end
    expect(onChange).toHaveBeenCalledWith(1, 3);
  });

  it('shows clear button when selection exists', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={0} max={2} onChange={onChange} />,
    );
    const clearButton = container.querySelector('button[title="Clear difficulty filter"]');
    expect(clearButton).toBeTruthy();
  });

  it('does not show clear button when no selection', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={null} max={null} onChange={onChange} />,
    );
    const clearButton = container.querySelector('button[title="Clear difficulty filter"]');
    expect(clearButton).toBeNull();
  });

  it('clear button resets selection to null', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={1} max={3} onChange={onChange} />,
    );
    const clearButton = container.querySelector('button[title="Clear difficulty filter"]')!;
    await fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it('marks active segments with aria-pressed true', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={1} max={3} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[3].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[4].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[5].getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking below range extends downward', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DifficultyRangeFilter min={3} max={4} onChange={onChange} />,
    );
    const buttons = container.querySelectorAll('button[aria-pressed]');
    await fireEvent.click(buttons[0]); // Beginner
    expect(onChange).toHaveBeenCalledWith(0, 4);
  });
});
