import React from 'react';
import { render, screen } from '@testing-library/react';
import { Overview } from '../../../webview/screens/Assess/tabs/VulnerabilityReport/tabs/Overview';
import { PassLocalLang } from '../../../common/types';

describe('Overview Component', () => {
  const mockVulnerability = {
    overview: {
      chapters: [
        {
          introText: 'Intro to vulnerability',
          body: 'Detailed body of vulnerability',
        },
      ],
      risk: { text: 'High risk' },
    },
    popupMessage: {
      lastDetected_date: '2024-03-01, 12:00 PM',
      firstDetected_date: '2024-01-01, 08:00 AM',
    },
  };

  const mockTranslate = {
    vulnerabilityReport: {
      tabs: {
        overView: {
          formFields: {
            whatHappened: { translate: 'What happened?' },
            whatsTheRisk: { translate: "What's the risk?" },
            firstDetectedDate: { translate: 'First Detected Date' },
            lastDetectedDate: { translate: 'Last Detected Date' },
          },
        },
      },
    },
  };

  test('renders the Overview component correctly', () => {
    render(
      <Overview
        translate={mockTranslate as unknown as PassLocalLang}
        vulnerability={mockVulnerability}
      />
    );
    expect(screen.getByText('What happened?')).toBeInTheDocument();
    expect(screen.getByText('Intro to vulnerability')).toBeInTheDocument();
    expect(
      screen.getByText('Detailed body of vulnerability')
    ).toBeInTheDocument();
    expect(screen.getByText("What's the risk?")).toBeInTheDocument();
    expect(screen.getByText('High risk')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('2024-03-01')).toBeInTheDocument();
  });

  test('handles missing chapters correctly', () => {
    const modifiedVulnerability = {
      ...mockVulnerability,
      overview: { risk: { text: 'Medium risk' } },
    };
    render(
      <Overview
        translate={mockTranslate as unknown as PassLocalLang}
        vulnerability={modifiedVulnerability}
      />
    );
    expect(screen.getByText('Medium risk')).toBeInTheDocument();
  });

  test('handles missing risk correctly', () => {
    const modifiedVulnerability = {
      ...mockVulnerability,
      overview: { chapters: [] },
    };
    render(
      <Overview
        translate={mockTranslate as unknown as PassLocalLang}
        vulnerability={modifiedVulnerability}
      />
    );
    expect(screen.queryByText('High risk')).not.toBeInTheDocument();
  });

  test('renders with missing translation correctly', async () => {
    const modifiedTranslate = {
      vulnerabilityReport: { tabs: { overView: {} } },
    };
    render(
      <Overview
        translate={modifiedTranslate as unknown as PassLocalLang}
        vulnerability={mockVulnerability}
      />
    );
  });
});
