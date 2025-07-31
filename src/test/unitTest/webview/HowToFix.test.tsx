import React from 'react';
import { render, screen } from '@testing-library/react';
import { HowToFix } from '../../../webview/screens/Assess/tabs/VulnerabilityReport/tabs/HowToFix';
// import { HowToFix } from './HowToFix';

describe('HowToFix Component', () => {
  const vulnerabilityMock = {
    howToFix: {
      recommendation: { formattedText: 'Fix this issue' },
      custom_recommendation: { text: 'Custom fix' },
      cwe: 'https://cwe.mitre.org/data/definitions/79.html',
      owasp: 'https://owasp.org/www-project-top-ten/',
      rule_references: { text: 'https://security-rules.com/rule' },
      custom_rule_references: { text: 'https://custom-rules.com/rule' },
    },
  };

  test('renders recommendation text', () => {
    render(<HowToFix vulnerability={vulnerabilityMock} />);
    expect(screen.getByText('Fix this issue')).toBeInTheDocument();
    expect(screen.getByText('Custom fix')).toBeInTheDocument();
  });

  test('renders CWE link when present', () => {
    render(<HowToFix vulnerability={vulnerabilityMock} />);
    const cweLink = screen.getByText(
      'https://cwe.mitre.org/data/definitions/79.html'
    );
    expect(cweLink).toBeInTheDocument();
    expect(cweLink.closest('a')).toHaveAttribute(
      'href',
      vulnerabilityMock.howToFix.cwe
    );
  });

  test('renders OWASP link when present', () => {
    render(<HowToFix vulnerability={vulnerabilityMock} />);
    const owaspLink = screen.getByText(
      'https://owasp.org/www-project-top-ten/'
    );
    expect(owaspLink).toBeInTheDocument();
    expect(owaspLink.closest('a')).toHaveAttribute(
      'href',
      vulnerabilityMock.howToFix.owasp
    );
  });

  test('renders rule references link when present', () => {
    render(<HowToFix vulnerability={vulnerabilityMock} />);
    const ruleRefLink = screen.getByText('https://security-rules.com/rule');
    expect(ruleRefLink).toBeInTheDocument();
    expect(ruleRefLink.closest('a')).toHaveAttribute(
      'href',
      vulnerabilityMock.howToFix.rule_references.text
    );
  });

  test('renders custom rule references link when present', () => {
    render(<HowToFix vulnerability={vulnerabilityMock} />);
    const customRuleRefLink = screen.getByText('https://custom-rules.com/rule');
    expect(customRuleRefLink).toBeInTheDocument();
    expect(customRuleRefLink.closest('a')).toHaveAttribute(
      'href',
      vulnerabilityMock.howToFix.custom_rule_references.text
    );
  });

  test('does not render CWE section when CWE is missing', () => {
    const modifiedMock = {
      howToFix: { ...vulnerabilityMock.howToFix, cwe: '' },
    };
    render(<HowToFix vulnerability={modifiedMock} />);
    expect(screen.queryByText('CWE')).not.toBeInTheDocument();
  });

  test('does not render OWASP section when OWASP is missing', () => {
    const modifiedMock = {
      howToFix: { ...vulnerabilityMock.howToFix, owasp: '' },
    };
    render(<HowToFix vulnerability={modifiedMock} />);
    expect(screen.queryByText('OWASP')).not.toBeInTheDocument();
  });
});
