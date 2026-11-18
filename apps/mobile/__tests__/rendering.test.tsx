import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { SecondaryButton } from '../src/components/common/SecondaryButton';
import { StatusBadge } from '../src/components/common/StatusBadge';
import { SectionHeader } from '../src/components/common/SectionHeader';
import { SearchInput } from '../src/components/common/SearchInput';

describe('Courtly Mobile Common Components Rendering', () => {
  it('renders PrimaryButton with title and responds to press', () => {
    const handlePress = jest.fn();
    const { getByText } = render(
      <PrimaryButton title="Book Court" onPress={handlePress} />,
    );

    const button = getByText('Book Court');
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('renders SecondaryButton in outlined variant', () => {
    const handlePress = jest.fn();
    const { getByText } = render(
      <SecondaryButton title="View Details" onPress={handlePress} />,
    );

    expect(getByText('View Details')).toBeTruthy();
  });

  it('renders StatusBadge with custom label and variant', () => {
    const { getByText } = render(
      <StatusBadge label="Demo Venue" variant="demo" />,
    );

    expect(getByText('Demo Venue')).toBeTruthy();
  });

  it('renders SectionHeader with title, subtitle, and action text', () => {
    const handleAction = jest.fn();
    const { getByText } = render(
      <SectionHeader
        title="Featured Venues"
        subtitle="Top rated turf & court facilities"
        actionText="View All"
        onActionPress={handleAction}
      />,
    );

    expect(getByText('Featured Venues')).toBeTruthy();
    expect(getByText('Top rated turf & court facilities')).toBeTruthy();

    const action = getByText('View All');
    fireEvent.press(action);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders SearchInput and accepts text changes', () => {
    const handleChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchInput
        value=""
        onChangeText={handleChangeText}
        placeholder="Search venues..."
      />,
    );

    const input = getByPlaceholderText('Search venues...');
    expect(input).toBeTruthy();

    fireEvent.changeText(input, 'Apex Arena');
    expect(handleChangeText).toHaveBeenCalledWith('Apex Arena');
  });
});
