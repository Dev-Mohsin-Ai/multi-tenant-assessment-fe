const roadmapCategories = [
  {
    id: 'endpoint-security',
    title: 'Endpoint Security',
    description:
      "Endpoint Security protects laptops, desktops, and mobile devices from cyber threats through controls like MDM, antivirus/EDR, device encryption, patching, and vulnerability management. By securing endpoints, businesses reduce risks of malware, exploits, and unauthorized access.",
    subcategories: [
      {
        id: 'endpoint-edr',
        title: 'Managed Antivirus + Endpoint Detection & Response (EDR)',
        description:
          "Managed Antivirus and Endpoint Detection and Response (EDR) provides continuous protection against threats by detecting, quarantining, and remediating malicious activity before it can compromise the client's environment. With centralized monitoring and management, businesses maintain a strong security posture and establish a reliable line of defense against exploits and attacks.",
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description: 'Fully deployed and managed EDR in place',
          },
          {
            id: 2,
            label: 'Partial',
            description: 'Antivirus present but no EDR, or EDR is unmanaged',
          },
          {
            id: 3,
            label: 'No',
            description: 'No antivirus or EDR solution in place',
          },
        ],
      },
      {
        id: 'endpoint-mdm',
        title: 'Mobile Device Management (MDM)',
        description:
          'MDM enforces security policies on company-issued and personal devices, ensuring encryption, patching, and compliance controls are applied consistently across endpoints.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'MDM deployed and enforced across all devices with full policy coverage (encryption, patching, compliance)',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'MDM in place but not fully enforced or inconsistently applied',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No MDM solution; devices unmanaged and unprotected',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'Not applicable if no company-issued or managed devices',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'endpoint-encryption',
        title: 'Device Encryption',
        description:
          'Device encryption protects sensitive data stored on company-issued endpoints by ensuring that information is only accessible to authorized users. If a device is lost or stolen, encryption prevents unauthorized access to business data.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Encryption is fully enforced across all company-issued devices via MDM',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Encryption is enabled on some devices, or enforced inconsistently across the fleet',
          },
          {
            id: 3,
            label: 'No',
            description:
              'Encryption is not enabled or enforced on company-issued devices',
          },
        ],
      },
      {
        id: 'endpoint-patch-management',
        title: 'Patch Management',
        description:
          'Patch Management ensures that operating systems and applications on endpoints are regularly updated with the latest security fixes and improvements. Standard mobile device management (MDM) platforms typically provide OS-level patching, while extended patch management extends this coverage to third-party and peripheral applications. Effective patching reduces the risk of exploitation from known vulnerabilities and strengthens overall endpoint security.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Comprehensive patching in place, covering OS and applications with automated deployment and monitoring',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Only OS patching via MDM; client acknowledges risk of unpatched third-party apps',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'Inconsistent or incomplete patching, leaving vulnerabilities unaddressed',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No endpoints or applications requiring patch management',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Insufficient information; requires discovery',
          },
        ],
      },
      {
        id: 'endpoint-vulnerability-management',
        title: 'Vulnerability Management',
        description:
          'Identifies, prioritizes, and remediates endpoint weaknesses to reduce the risk of exploitation.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Formal vulnerability management with scanning and remediation',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Limited or ad hoc scanning, inconsistent remediation',
          },
          {
            id: 3,
            label: 'No',
            description: 'No vulnerability management solution in place',
          },
        ],
      },
      {
        id: 'endpoint-workstation-age',
        title: 'Workstation Age',
        description:
          'Evaluates lifecycle of company-issued devices; older systems increase risk due to unsupported OS and reduced performance.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Majority of devices < 3 years old',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Some devices 3-5 years old; risk accepted',
          },
          {
            id: 3,
            label: 'Needs Attention',
            description: 'Significant portion outdated or unsupported',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'Company follows a BYOD model and does not provide company-issued workstations',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Device age details not yet gathered',
          },
        ],
      },
    ],
  },
  {
    id: 'email-security',
    title: 'Email Security',
    description:
      'Email Security protects against phishing, malware, spoofing, and unauthorized access. While Google Workspace and Microsoft 365 provide baseline protections, layering advanced filtering, encryption, and monitoring strengthens defenses and reduces the risk of compromise.',
    subcategories: [
      {
        id: 'email-advanced-filtering',
        title: 'Advanced Email Security (Filtering + Advanced Threat Protection)',
        description:
          'Adds third-party protection on top of Google Workspace or Microsoft 365 to enhance phishing, spam, malware, and zero-day threat detection beyond native controls.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Third-party email security solution deployed and managed',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Using Google/Microsoft best practices; no third-party layer',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No advanced filtering and poor/no configuration of native settings',
          },
          {
            id: 4,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'email-awareness-training',
        title: 'Email Awareness Training',
        description:
          'Trains employees through phishing simulations and awareness programs to reduce risk from email-based attacks.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Regular phishing simulations and training program in place',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Training program exists but not scheduled on a recurring cadence',
          },
          {
            id: 3,
            label: 'Needs Attention',
            description: 'No structured training program in place',
          },
          {
            id: 4,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'email-authentication',
        title: 'Email Authentication (SPF, DKIM, DMARC)',
        description:
          'Authentication protocols verify sending domains and reduce spoofing and phishing risks.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'SPF, DKIM, DMARC fully implemented and enforced against usage requirements',
          },
          {
            id: 2,
            label: 'Partial',
            description: 'Configured but not fully enforced',
          },
          {
            id: 3,
            label: 'No',
            description: 'No authentication protocols in place',
          },
        ],
      },
      {
        id: 'email-encryption',
        title: 'Email Encryption',
        description:
          'Encrypts sensitive email content to protect confidentiality and meet compliance requirements.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Encryption enabled and enforced for sensitive email',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Available but not consistently enforced; client accepts risk',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No encryption in place; sensitive data exposed',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No sensitive data transmitted via email',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'email-cloud-mdr',
        title: 'Cloud Managed Detection and Response (MDR)',
        description:
          'Cloud MDR integrates with Google Workspace or Microsoft 365 to detect attacker behaviors, monitor identities and actions, and provide 24/7 SOC-led investigation and response. It strengthens defenses beyond traditional filtering and Advanced Threat Protection.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Cloud MDR fully deployed with SOC monitoring and tradecraft detection',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Relying on native alerting and admin review without MDR',
          },
          {
            id: 3,
            label: 'No',
            description:
              'No cloud-integrated monitoring or advanced detection in place',
          },
        ],
      },
    ],
  },
  {
    id: 'identity-security',
    title: 'Identity Security',
    description:
      'Identity Security ensures that user accounts and credentials are protected through secure authentication, centralized access, and password controls. Strong identity practices reduce the risk of unauthorized access and account compromise.',
    subcategories: [
      {
        id: 'identity-sso',
        title: 'Single Sign-On (SSO)',
        description:
          'Centralizes access management, allowing users to log in once to securely access multiple applications.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'SSO deployed across major apps with directory integration',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'SSO available but not enforced across all apps',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No SSO solution; users manage multiple logins separately',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if company does not use SaaS apps',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'identity-password-management',
        title: 'Password Management',
        description:
          'Centralizes and enforces strong password policies through tools that store, generate, and share credentials securely.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Password manager deployed and enforced org-wide',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Password manager available but adoption not org-wide',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No password manager in place; reliance on weak/shared passwords',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no shared credentials are used',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'identity-mfa',
        title: 'Multi-Factor Authentication (MFA)',
        description:
          'Adds a second layer of verification beyond passwords, reducing risk from stolen credentials.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description: 'MFA enforced across all users and systems',
          },
          {
            id: 2,
            label: 'Partial',
            description: 'MFA enabled but not enforced org-wide',
          },
          {
            id: 3,
            label: 'No',
            description: 'MFA not enabled',
          },
        ],
      },
    ],
  },
  {
    id: 'contractor-security',
    title: 'Contractor Security',
    description:
      'Contractor Security ensures consistent security standards when contractors or employees use personal or non-company devices. Controls like virtual desktops and BYOD MDM reduce risks while enabling productivity and compliance.',
    subcategories: [
      {
        id: 'contractor-vdi',
        title: 'Virtual Desktop Infrastructure (VDI)',
        description:
          'Provides secure virtual desktops for contractors and employees using non-company devices, ensuring consistent security standards and controlled access to business applications.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'VDI deployed and required for contractors/non-company devices',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'VDI available but not enforced for all non-company devices',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No VDI in place; contractors use unmanaged personal devices',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'Organization does not engage contractors or allow non-company devices',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'contractor-byod-mdm',
        title: 'BYOD MDM',
        description:
          'Manages and secures personal devices (phones, laptops) used for work through mobile device management policies, protecting sensitive data while enabling productivity.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'BYOD MDM enforced across all personal devices with corporate access',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'BYOD MDM available but adoption not enforced universally or application policies for business software is in place',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No BYOD MDM or applications policies are in place; unmanaged personal devices access company data',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'No BYOD policy in place or personal devices not used for work',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
    ],
  },
  {
    id: 'physical-security',
    title: 'Physical Security',
    description:
      'Physical Security protects business premises and sensitive resources from unauthorized access, theft, or damage. Controls include hardware keys, security cameras, and badge systems. If no office environment exists, this category is not applicable.',
    subcategories: [
      {
        id: 'physical-hardware-keys',
        title: 'Hardware Keys',
        description:
          'Provides a physical method of authentication to secure access to systems and sensitive information.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Hardware keys deployed and required for sensitive access',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Keys available but not enforced across all critical systems',
          },
          {
            id: 3,
            label: 'Needs Attention',
            description: 'No hardware key usage for sensitive resources',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No office environment or no sensitive systems requiring hardware keys',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'physical-security-cameras',
        title: 'Security Cameras',
        description:
          'Monitors and records activity in and around premises for real-time surveillance and evidence collection.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Cameras deployed, monitored, and footage retained',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Cameras installed but not consistently monitored or recorded',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No surveillance system in place',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No office environment',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'physical-badge-ids',
        title: 'Badge IDs / Key Fobs',
        description:
          'Electronic access devices granting entry to secured areas through proximity-based authentication.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Badge/fob access enforced and access logs reviewed',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Badges/fobs in use but not consistently enforced or reviewed',
          },
          {
            id: 3,
            label: 'Needs Attention',
            description: 'No badge/fob system; uncontrolled access to facilities',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No office environment',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
    ],
  },
  {
    id: 'network-optimization-security',
    title: 'Network Optimization and Security',
    description:
      'Network Operations & Security ensures reliable, high-performing, and secure connectivity. Cloud-managed hardware with physical firewalls provides centralized control and protection, while resilient ISP circuits, failover connections, DNS filtering, VPNs, and lifecycle hardware management reduce risk and downtime.',
    subcategories: [
      {
        id: 'network-cloud-management',
        title: 'Cloud Network Management',
        description:
          'Cloud-based tools streamline monitoring and management of network infrastructure while physical firewalls provide core perimeter protection. Together, they enable centralized visibility, simplified management, and secure connectivity.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Cloud-managed networking fully deployed with physical firewall in place and actively managed',
          },
          {
            id: 2,
            label: 'Needs Attention',
            description:
              'Cloud management enabled but firewall not fully managed or standardized across sites',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No cloud-managed networking; firewall unmanaged or absent',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No office or managed network environment',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'network-hardware-age',
        title: 'Network Hardware Age',
        description:
          'Age of networking hardware (firewalls, access points, switches) affects performance, security, and reliability.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Majority of network hardware within lifecycle (<5 years old)',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Some devices aging but risk acknowledged',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'Network firewall is outdated and presents a security vulnerability',
          },
          {
            id: 4,
            label: 'Needs Attention',
            description: 'Significant portion of hardware outdated or unsupported',
          },
          {
            id: 5,
            label: 'Not Applicable',
            description: 'No office or managed network equipment in use',
          },
          {
            id: 6,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'network-isp-circuit',
        title: 'ISP Circuit',
        description:
          'Dedicated business-class internet circuits with SLAs that provide reliable performance, uptime, and support.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Dedicated ISP circuit with SLA in place',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Business internet used but limited SLA coverage',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'Residential or consumer-grade ISP with no SLA',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No physical office requiring ISP circuit',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'network-failover-internet',
        title: 'Failover Internet',
        description:
          'Secondary connection that activates automatically if the primary internet fails, ensuring business continuity.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Failover internet connection deployed and tested',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Failover exists but not tested or broadly configured',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No failover; single internet connection in place',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No office operations dependent on internet',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'network-dns-security',
        title: 'DNS Security',
        description:
          'Provides domain-level filtering to prevent access to malicious or unauthorized websites, supporting safe browsing in office and remote environments.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'DNS filtering deployed and enforced across endpoints',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'DNS filtering enabled but not enforced org-wide',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No DNS filtering; devices exposed to malicious sites',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no managed endpoints',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'network-vpn',
        title: 'VPN',
        description:
          'Virtual Private Network provides secure, encrypted connections for remote users, enhancing privacy and enabling compliance with access requirements.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'VPN deployed with enforced use and static IPs',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'VPN available but not consistently enforced',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No VPN solution; remote access unprotected',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no remote users or external access needs',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
    ],
  },
  {
    id: 'comprehensive-security',
    title: 'Comprehensive Security',
    description:
      'Comprehensive Security covers advanced controls, strategy, and oversight to strengthen defenses across the business. These solutions address human risk, AI adoption, SaaS usage, data protection, compliance, and overall security posture.',
    subcategories: [
      {
        id: 'comp-security-awareness',
        title: 'Security Awareness Training',
        description:
          'Educates employees on cyber threats and response protocols, reducing risk from human error.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Ongoing training with a defined cadence in place',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Training exists but not recurring or structured',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No structured awareness training program',
          },
          {
            id: 4,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'comp-secure-ai',
        title: 'Secure AI',
        description:
          'Provides controlled access to paid LLMs via managed accounts, excluding organizational data from training sets and offering role-based AI training.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Secure AI access and training in place, centrally managed',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'AI access exists but not managed; risk of shadow AI',
          },
          {
            id: 3,
            label: 'Needs Attention',
            description: 'No secure AI policy; unmanaged usage',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No AI adoption within the organization',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'comp-shadow-it',
        title: 'Shadow IT & SaaS Discovery',
        description:
          'Identifies and monitors unauthorized apps and services to maintain visibility and reduce risk.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'SaaS discovery solution in place, with monitoring and reporting',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Partial visibility into SaaS usage; risk accepted',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No SaaS discovery; unsanctioned apps unmanaged',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No SaaS usage within the organization outside of approved applications',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'comp-dlp',
        title: 'Data Loss Prevention (DLP)',
        description:
          'Classifies and protects sensitive information by preventing unauthorized access, sharing, or transfer.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'DLP deployed with classification and enforcement',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Some DLP measures exist but not enforced consistently',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No DLP in place; sensitive data unprotected',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no sensitive data handled',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'comp-penetration-testing',
        title: 'Penetration Testing',
        description:
          'Simulates cyberattacks to identify vulnerabilities and test defenses.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Penetration testing conducted regularly with remediation',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Testing performed occasionally; not recurring',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No penetration testing performed',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no external systems',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'comp-cyber-insurance',
        title: 'Cyber Liability Insurance',
        description:
          'Provides financial protection against losses from cyber incidents like data breaches or ransomware.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Policy active with appropriate coverage',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Coverage limited or outdated',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No cyber insurance in place',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable for very small organizations with a narrow exposure to risk',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
    ],
  },
  {
    id: 'compliance-readiness',
    title: 'Compliance Readiness',
    description:
      'Evaluates the fundamental organizational structure, industry context, and leadership commitment necessary for establishing effective cybersecurity compliance programs.',
    subcategories: [
      {
        id: 'compliance-requirements-understanding',
        title: 'Industry-specific Cybersecurity Requirements Understanding',
        description:
          "Assesses the organization's awareness of industry-specific cybersecurity standards and regulatory requirements applicable to their business operations.",
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Comprehensive understanding of industry requirements with established compliance framework',
          },
          {
            id: 2,
            label: 'At Risk',
            description:
              'No awareness of industry-specific requirements or significant gaps in compliance understanding',
          },
          {
            id: 3,
            label: 'Needs Attention',
            description:
              'Basic awareness of industry requirements but incomplete understanding or inconsistent application',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'Limited industry-specific requirements or no compliance required',
          },
        ],
      },
      {
        id: 'compliance-grc',
        title: 'Compliance Documentation / Governance Risk and Compliance (GRC)',
        description:
          'Helps manage regulatory requirements, identify risks, and implement controls for compliance.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'GRC tools in place with compliance processes defined',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Compliance handled manually; partial coverage',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No GRC/compliance processes in place',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no compliance requirements exist',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'compliance-fractional-ciso',
        title: 'Fractional CISO',
        description:
          'Provides part-time executive-level cybersecurity leadership to guide strategy and risk management.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Fractional/full-time CISO actively engaged',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Security leadership present but informal or limited',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No CISO function in place; strategy absent',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable is formal compliance is not required',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'compliance-siem-soc',
        title: 'Security Incidents and Events Management (SIEM) and Security Operations Center (SOC)',
        description:
          'Provides 24/7 monitoring and alerting by security experts for continuous detection and response.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'SOC/SIEM in place with 24/7 monitoring',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description: 'Logging in place but not actively monitored by SOC',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No SOC/SIEM solution; limited visibility into threats',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if very small org with no compliance needs',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'compliance-disaster-recovery',
        title: 'Disaster Recovery and Failover Capabilities',
        description:
          "Assesses the organization's technical disaster recovery capabilities and ability to failover critical systems during emergencies.",
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Comprehensive disaster recovery with automated failover and regular testing',
          },
          {
            id: 2,
            label: 'Needs Attention',
            description:
              'Basic DR planning but limited automation or testing',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No disaster recovery capabilities; extended downtime risk during major incidents',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'Disaster recovery handled by cloud providers or external services',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'compliance-asset-disposal',
        title: 'Secure Asset Disposal Procedures',
        description:
          "Evaluates the organization's processes for securely disposing of IT assets and ensuring complete data destruction.",
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Comprehensive secure disposal procedures with certified destruction and proper documentation',
          },
          {
            id: 2,
            label: 'Needs Attention',
            description:
              'Basic disposal procedures but inconsistent application or inadequate data destruction',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No formal disposal procedures; risk of data exposure through improper asset disposal',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'No formal compliance requirements or minimal asset turnover',
          },
        ],
      },
    ],
  },
  {
    id: 'continuity',
    title: 'Continuity',
    description:
      'Continuity ensures business resilience by safeguarding data across cloud platforms and endpoints. Backup solutions protect against ransomware, accidental deletion, and data loss while enabling compliance and recovery when incidents occur.',
    subcategories: [
      {
        id: 'continuity-endpoint',
        title: 'Endpoint Continuity',
        description:
          'Endpoint backups create redundancy to protect locally stored files against ransomware, loss, or accidental deletion.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Endpoint backup deployed with full coverage and recovery',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Endpoint backup exists but not enforced for all devices',
          },
          {
            id: 3,
            label: 'At Risk',
            description: 'No endpoint backup; local files unprotected',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if all data resides in cloud',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'continuity-cloud',
        title: 'Cloud Continuity',
        description:
          'Cloud backups protect against ransomware and accidental deletion while retaining historical employee data and mailboxes for compliance.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description: 'Cloud backup deployed with retention and recovery enabled',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Cloud backup available but coverage limited (ex. Google Takeout or Shared Mailboxes)',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No cloud backup; reliant on limited SaaS provider retention only',
          },
          {
            id: 4,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
    ],
  },
  {
    id: 'integration-productivity',
    title: 'Integration and Productivity',
    description:
      'Integration & Productivity solutions streamline collaboration, communications, financial management, and IT operations. These tools improve efficiency, ensure consistency, and enable businesses to scale while maintaining security and compliance.',
    subcategories: [
      {
        id: 'integration-email-suite',
        title: 'Email (Productivity Suite)',
        description:
          'Integrating email systems with the broader tech stack enables seamless communication and data exchange across platforms.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Operating on Google Workspace or M365 with appropriate licensing against intended usage',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Operating on Google Workspace or M365 but with licensing mismatch',
          },
          {
            id: 3,
            label: 'No',
            description:
              'Operating on another email productivity suite outside of Google or Microsoft',
          },
        ],
      },
      {
        id: 'integration-signature-management',
        title: 'Signature Management Solution',
        description:
          'Standardizes and automates email signatures to ensure brand consistency and legal compliance.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description: 'Centralized signature management deployed',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Signature solution exists but inconsistently applied or not standardized',
          },
          {
            id: 3,
            label: 'No',
            description:
              'No standardized signatures; manual or inconsistent branding',
          },
        ],
      },
      {
        id: 'integration-file-sharing',
        title: 'File Sharing',
        description:
          'Integrated file sharing improves collaboration, enabling efficient access to files across systems and applications.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'File sharing integrated across a singular platform with appropriate access controls',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Access control in place; data silos across multiple file sharing platforms',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'Data siloed with inadequate access controls, limiting collaboration and creating risk',
          },
          {
            id: 4,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'integration-servers',
        title: 'Physical / Virtual Servers',
        description:
          'Provide infrastructure to host applications, store data, and manage computing resources across remote and hybrid environments.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Servers deployed, maintained, and aligned with business needs',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Servers in place but not consistently maintained or integrated or physical hardware is aging',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'End of life hardware structured server infrastructure in place',
          },
          {
            id: 4,
            label: 'Needs Attention',
            description:
              'Physical server in use; would benefit from evaluating cloud migration',
          },
          {
            id: 5,
            label: 'Not Applicable',
            description:
              'Not applicable if fully SaaS-based and no hosted software',
          },
          {
            id: 6,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'integration-accounting-erp',
        title: 'Accounting / ERP',
        description:
          'Streamlines financial management by integrating business processes into a unified platform for improved accuracy and efficiency.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'ERP/accounting platform in place, integrated with business systems',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'Accounting tools used but not fully integrated with other systems',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No ERP or accounting integration; processes manual',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description:
              'Not applicable for small businesses with simplified accounting needs',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
      {
        id: 'integration-voip',
        title: 'Managed VoIP',
        description:
          'VoIP services deliver cost-effective communication over the internet with third-party management and support.',
        response_options: [
          {
            id: 1,
            label: 'Satisfactory',
            description:
              'Managed VoIP solution in place, integrated and supported',
          },
          {
            id: 2,
            label: 'Acceptable Risk',
            description:
              'VoIP in use but not fully integrated or reliably supported',
          },
          {
            id: 3,
            label: 'At Risk',
            description:
              'No VoIP system; relying on unmanaged or legacy phones',
          },
          {
            id: 4,
            label: 'Not Applicable',
            description: 'Not applicable if no business phone needs',
          },
          {
            id: 5,
            label: 'Unknown',
            description: 'Requires discovery',
          },
        ],
      },
    ],
  },
  {
    id: 'license-management',
    title: 'License Management',
    description:
      'License Management ensures that core business services (Microsoft, Google, AWS, ISP, and Cyber Insurance) are properly managed, aligned to business needs, and cost-optimized. This reduces waste, ensures compliance, and maintains operational resilience.',
    subcategories: [
      {
        id: 'license-google-workspace',
        title: 'Google Workspace',
        description:
          'Manages Google Workspace licensing to ensure appropriate features and security coverage.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Aligned with needs and managed with Interlaced discounts',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Aligned with needs but no discounts or Interlaced management in place',
          },
          {
            id: 3,
            label: 'No',
            description:
              'Not aligned with needs; unmanaged and no discounts applied',
          },
        ],
      },
      {
        id: 'license-microsoft-365',
        title: 'Microsoft 365',
        description:
          'Manages Microsoft licensing (M365, Windows, etc.) to align features, security, and compliance.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Aligned with needs and managed with Interlaced discounts',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Aligned with needs but no discounts or Interlaced management in place',
          },
          {
            id: 3,
            label: 'No',
            description:
              'Not aligned with needs; unmanaged and no discounts applied',
          },
        ],
      },
      {
        id: 'license-cloud-services',
        title: 'Cloud Services (AWS / Azure / GCP)',
        description:
          'Manages cloud service licensing and billing (AWS, Azure, GCP) to ensure applications and infrastructure are rightsized, secure, and cost-optimized.',
        response_options: [
          {
            id: 1,
            label: 'Yes',
            description:
              'Cloud services aligned with needs and managed with Interlaced discounts',
          },
          {
            id: 2,
            label: 'Partial',
            description:
              'Cloud services aligned with needs but no discounts or Interlaced management in place',
          },
          {
            id: 3,
            label: 'No',
            description:
              'Cloud services not aligned with needs; unmanaged and no discounts applied',
          },
        ],
      },
    ],
  },
]

const roadmapTemplate = {
  id: 'demo-roadmap-template',
  title: 'Roadmap Assessment Template',
  description: 'Demo template used for UI preview.',
  categories: roadmapCategories,
}

export const demoTemplateCatalog = [roadmapTemplate]

const demoOptionDescription = 'Full template preview with categories and questions.'

export const demoTemplateOptions = [
  {
    value: 'demo-roadmap-template',
    label: 'Roadmap Assessment Template (Demo)',
    description: demoOptionDescription,
    isDemo: true,
    template: roadmapTemplate,
  },
]

export const getDemoTemplateForOption = (optionValue) => {
  const match = demoTemplateOptions.find((option) => option.value === optionValue)
  return match?.template || roadmapTemplate
}
