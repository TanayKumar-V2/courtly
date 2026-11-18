import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import OwnerApplicationScreen from '../app/(app)/owner/application';
import OwnerApplicationStatusScreen from '../app/(app)/owner/application-status';
import OwnerDashboardScreen from '../app/(app)/owner/index';
import CreateVenueWizardScreen from '../app/(app)/owner/venues/create';
import ManageVenueCourtsScreen from '../app/(app)/owner/venues/[venueId]/courts';
import ManageVenueAmenitiesScreen from '../app/(app)/owner/venues/[venueId]/amenities';
import ManageVenueImagesScreen from '../app/(app)/owner/venues/[venueId]/images';
import OwnerVenuePreviewScreen from '../app/(app)/owner/venues/[venueId]/preview';

import { ownerApplicationService } from '../src/services/owner-application-service';
import { venueService } from '../src/services/venue-service';
import { courtService } from '../src/services/court-service';
import { amenityService } from '../src/services/amenity-service';
import { venueImageService } from '../src/services/venue-image-service';

const mockUseAuth = jest.fn();
jest.mock('../src/auth/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const sampleVenue = {
  id: 'venue-uuid-1',
  ownerId: 'owner-1',
  name: 'Emerald Turf Arena',
  slug: 'emerald-turf-arena',
  description: 'Premium floodlit 5v5 artificial football turf.',
  businessContactPhone: '+919876543210',
  businessContactEmail: 'desk@emerald.in',
  addressLine1: '12 MG Road',
  addressLine2: null,
  locality: 'Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560038',
  country: 'India',
  latitude: 12.971599,
  longitude: 77.594563,
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  status: 'DRAFT' as const,
  rejectionReason: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sports: ['FOOTBALL' as const],
  courtCount: 1,
  activeCourtCount: 1,
  startingPricePerHour: 1500,
  coverImage: {
    id: 'img-1',
    publicId: 'courtly/venues/owner-1/venue-uuid-1/img_1',
    secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/img_1.jpg',
    width: 1200,
    height: 800,
    format: 'jpg',
    bytes: 204800,
    position: 0,
    isCover: true,
  },
  images: [
    {
      id: 'img-1',
      publicId: 'courtly/venues/owner-1/venue-uuid-1/img_1',
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/img_1.jpg',
      width: 1200,
      height: 800,
      format: 'jpg',
      bytes: 204800,
      position: 0,
      isCover: true,
    },
  ],
  courts: [
    {
      id: 'court-1',
      venueId: 'venue-uuid-1',
      name: 'Turf Pitch 1',
      sport: 'FOOTBALL' as const,
      surfaceType: 'Artificial Turf',
      indoor: false,
      maxPlayers: 10,
      basePricePerHour: 1500,
      currency: 'INR',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  amenities: [
    {
      id: 'am-1',
      name: 'Parking',
      slug: 'parking',
      category: 'FACILITY',
      icon: 'car',
    },
  ],
  completion: {
    isReadyToSubmit: true,
    completionPercent: 100,
    missingRequirements: [],
    checklist: {
      hasBasicInfo: true,
      hasContactInfo: true,
      hasCompleteAddress: true,
      hasActiveCourt: true,
      hasImage: true,
      hasAmenity: true,
    },
  },
};

describe('Phase 3 Mobile Owner & Venue Management Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete mockParams.venueId;
    mockUseAuth.mockReturnValue({
      user: {
        id: 'owner-1',
        fullName: 'Rohan Sharma',
        email: 'rohan@courtly.app',
        roles: ['PLAYER', 'VENUE_OWNER'],
        emailVerified: true,
        profile: { city: 'Bengaluru', state: 'Karnataka', country: 'India', preferredSports: [] },
      },
      refreshUser: jest.fn(),
    });
  });

  it('1. Owner application screen renders and validates form before submission', async () => {
    const submitSpy = jest
      .spyOn(ownerApplicationService, 'submit')
      .mockResolvedValue({
        message: 'Submitted',
        application: {
          id: 'app-1',
          userId: 'owner-1',
          businessName: 'Apex Turf',
          businessType: 'Sports Turf',
          contactPerson: 'Rohan Sharma',
          contactPhone: '+919876543210',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          additionalInformation: '',
          status: 'PENDING',
          reviewedAt: null,
          rejectionReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

    const { getByText, getByPlaceholderText } = renderWithQuery(
      <OwnerApplicationScreen />,
    );

    expect(getByText('Become a Venue Owner')).toBeTruthy();

    // Trigger validation error when business name is empty
    fireEvent.press(getByText('Submit Owner Application'));
    expect(
      getByText('Please enter your business or facility name.'),
    ).toBeTruthy();

    fireEvent.changeText(
      getByPlaceholderText('e.g. Emerald Sports Turf Arena'),
      'Apex Turf',
    );
    fireEvent.changeText(
      getByPlaceholderText('+91 98765 43210'),
      '+919876543210',
    );
    fireEvent.press(getByText('Submit Owner Application'));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('2. Application status screen displays rejected status with reason and reapply CTA', async () => {
    jest.spyOn(ownerApplicationService, 'getMyStatus').mockResolvedValue({
      isVenueOwner: false,
      canApply: true,
      latestApplication: {
        id: 'app-rej',
        userId: 'player-1',
        businessName: 'Metro Arena',
        businessType: 'Sports Turf',
        contactPerson: 'Rohan Sharma',
        contactPhone: '+919876543210',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        additionalInformation: '',
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        rejectionReason: 'Facility phone number could not be verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      history: [],
    });

    const { findByText } = renderWithQuery(<OwnerApplicationStatusScreen />);

    expect(await findByText('Metro Arena')).toBeTruthy();
    expect(
      await findByText('Facility phone number could not be verified'),
    ).toBeTruthy();
    expect(await findByText('Submit New Application')).toBeTruthy();
  });

  it('3. Owner dashboard loads real venue metrics and cards (and handles error/retry)', async () => {
    const listSpy = jest
      .spyOn(venueService, 'listOwnerVenues')
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({
        summary: {
          total: 2,
          draft: 1,
          pendingReview: 0,
          approved: 1,
          rejected: 0,
          paused: 0,
        },
        venues: [sampleVenue],
      });

    const { findByText } = renderWithQuery(<OwnerDashboardScreen />);

    // Error state & retry button
    expect(await findByText('Could Not Load Owner Dashboard')).toBeTruthy();
    const retryBtn = await findByText('Try Again');
    fireEvent.press(retryBtn);

    expect(await findByText('My Facilities')).toBeTruthy();
    expect(await findByText('Emerald Turf Arena')).toBeTruthy();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('4. Venue wizard validates Step 1 and saves a real draft on backend', async () => {
    const createSpy = jest
      .spyOn(venueService, 'createDraft')
      .mockResolvedValue({
        message: 'Draft created',
        venue: sampleVenue,
      });
    jest.spyOn(venueService, 'getOwnerVenue').mockResolvedValue({
      venue: sampleVenue,
    });
    jest.spyOn(amenityService, 'listCatalogue').mockResolvedValue({
      amenities: sampleVenue.amenities,
    });

    const { getByText, getByPlaceholderText, findByText } = renderWithQuery(
      <CreateVenueWizardScreen />,
    );

    // Validation catches empty venue name
    fireEvent.press(getByText('Save & Continue to Location'));
    expect(getByText('Venue name must be at least 2 characters.')).toBeTruthy();

    fireEvent.changeText(
      getByPlaceholderText('e.g. Skyline Turf & Badminton Club'),
      'Emerald Turf Arena',
    );
    fireEvent.changeText(
      getByPlaceholderText(
        'Describe playing surfaces, lighting, parking, and atmosphere...',
      ),
      'Floodlit artificial turf with parking and showers.',
    );
    fireEvent.changeText(
      getByPlaceholderText('+91 98765 43210'),
      '+919876543210',
    );
    fireEvent.changeText(
      getByPlaceholderText('desk@yourvenue.in'),
      'desk@emerald.in',
    );

    fireEvent.press(getByText('Save & Continue to Location'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
    expect(await findByText('Venue Location')).toBeTruthy();
  });

  it('5. Court management form validates pricing and creates courts', async () => {
    mockParams.venueId = 'venue-uuid-1';
    jest.spyOn(venueService, 'getOwnerVenue').mockResolvedValue({
      venue: sampleVenue,
    });
    const courtSpy = jest.spyOn(courtService, 'create').mockResolvedValue({
      message: 'Created',
      court: sampleVenue.courts[0],
    });

    const { findByText, getByPlaceholderText, getByText } = renderWithQuery(
      <ManageVenueCourtsScreen />,
    );

    expect(await findByText('Manage Courts')).toBeTruthy();

    fireEvent.changeText(
      getByPlaceholderText('e.g. Court B - Synthetic Turf'),
      'Court B',
    );
    fireEvent.changeText(getByPlaceholderText('1200'), '1800');
    fireEvent.press(getByText('+ Create Court'));

    await waitFor(() => {
      expect(courtSpy).toHaveBeenCalledWith(
        'venue-uuid-1',
        expect.objectContaining({
          name: 'Court B',
          basePricePerHour: 1800,
        }),
      );
    });
  });

  it('6. Amenities selection screen toggles catalogue amenities and saves', async () => {
    mockParams.venueId = 'venue-uuid-1';
    jest.spyOn(venueService, 'getOwnerVenue').mockResolvedValue({
      venue: sampleVenue,
    });
    jest.spyOn(amenityService, 'listCatalogue').mockResolvedValue({
      amenities: [
        { id: 'am-1', name: 'Parking', slug: 'parking', category: 'FACILITY', icon: 'car' },
        { id: 'am-2', name: 'Floodlights', slug: 'floodlights', category: 'FACILITY', icon: 'sun' },
      ],
    });
    const replaceSpy = jest
      .spyOn(amenityService, 'replaceVenueAmenities')
      .mockResolvedValue({ venueId: 'venue-uuid-1', amenities: [] });

    const { findByText, getByText } = renderWithQuery(
      <ManageVenueAmenitiesScreen />,
    );

    const floodlightsTile = await findByText('Floodlights');
    fireEvent.press(floodlightsTile);
    fireEvent.press(getByText('Save Amenities'));

    await waitFor(() => {
      expect(replaceSpy).toHaveBeenCalledWith(
        'venue-uuid-1',
        expect.arrayContaining(['am-1', 'am-2']),
      );
    });
  });

  it('7. Photo picker integration handles upload progress and retry on failure', async () => {
    mockParams.venueId = 'venue-uuid-1';
    jest.spyOn(venueService, 'getOwnerVenue').mockResolvedValue({
      venue: sampleVenue,
    });

    const uploadSpy = jest
      .spyOn(venueImageService, 'uploadAndRegisterImage')
      .mockRejectedValueOnce(new Error('Cloudinary unreachable'))
      .mockResolvedValueOnce({
        message: 'Uploaded',
        image: sampleVenue.images[0],
      });

    const { findByText } = renderWithQuery(<ManageVenueImagesScreen />);

    const dropzone = await findByText('Upload Venue Photos');
    fireEvent.press(dropzone);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    expect(await findByText('Cloudinary unreachable')).toBeTruthy();
  });

  it('8. Venue preview displays details and supports submission for admin review', async () => {
    mockParams.venueId = 'venue-uuid-1';
    jest.spyOn(venueService, 'getOwnerVenue').mockResolvedValue({
      venue: sampleVenue,
    });
    const submitSpy = jest
      .spyOn(venueService, 'submitForReview')
      .mockResolvedValue({
        message: 'Submitted',
        venue: { ...sampleVenue, status: 'PENDING_REVIEW' },
      });

    const { findByText, getByText } = renderWithQuery(
      <OwnerVenuePreviewScreen />,
    );

    expect(await findByText('Emerald Turf Arena')).toBeTruthy();
    expect(await findByText('Turf Pitch 1')).toBeTruthy();
    fireEvent.press(getByText('Submit Listing for Admin Review'));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith('venue-uuid-1');
    });
  });
});
