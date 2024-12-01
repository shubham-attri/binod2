export interface CaseThread {
  id: string;
  title: string;
  messages: {
    id: string;
    content: string;
    timestamp: Date;
    sender: string;
    role: 'user' | 'assistant';
  }[];
  status: 'active' | 'resolved' | 'pending';
  lastUpdated: Date;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  client: {
    name: string;
    email: string;
    company?: string;
  };
  status: 'active' | 'closed' | 'pending';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
  threads: CaseThread[];
  documents: {
    id: string;
    name: string;
    type: string;
    uploadedAt: Date;
    size: number;
  }[];
  tags: string[];
}

export const mockCases: Case[] = [
  {
    id: "CASE-001",
    title: "Contract Review - Tech Startup Acquisition",
    description: "Review and analysis of acquisition agreement for a tech startup valued at $10M",
    client: {
      name: "John Smith",
      email: "john.smith@techstartup.com",
      company: "TechStart Inc."
    },
    status: "active",
    priority: "high",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-20"),
    threads: [
      {
        id: "THR-001",
        title: "Initial Contract Review",
        status: "active",
        lastUpdated: new Date("2024-02-20"),
        messages: [
          {
            id: "MSG-001",
            content: "I need help reviewing this acquisition agreement. Key concerns are IP rights and employee retention.",
            timestamp: new Date("2024-02-15T10:00:00"),
            sender: "John Smith",
            role: "user"
          },
          {
            id: "MSG-002",
            content: "I'll help you review the agreement. Let's start with the IP rights section. The current terms state that all intellectual property will be transferred to the acquiring company upon closing. However, I notice a few potential issues:\n\n1. The definition of IP is quite broad and may include personal projects of employees\n2. There's no clear provision for licensed third-party IP\n3. The assignment of future IP rights needs clarification",
            timestamp: new Date("2024-02-15T10:05:00"),
            sender: "AI Assistant",
            role: "assistant"
          }
        ]
      }
    ],
    documents: [
      {
        id: "DOC-001",
        name: "acquisition_agreement_v1.pdf",
        type: "application/pdf",
        uploadedAt: new Date("2024-02-15"),
        size: 2500000
      }
    ],
    tags: ["acquisition", "tech", "high-priority"]
  },
  {
    id: "CASE-002",
    title: "Employment Contract Template Update",
    description: "Update company's standard employment contract template to comply with new labor laws",
    client: {
      name: "Sarah Johnson",
      email: "sarah.j@hrtech.com",
      company: "HRTech Solutions"
    },
    status: "pending",
    priority: "medium",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-18"),
    threads: [
      {
        id: "THR-002",
        title: "Remote Work Policy Updates",
        status: "active",
        lastUpdated: new Date("2024-02-18"),
        messages: [
          {
            id: "MSG-003",
            content: "We need to update our employment contract template to include comprehensive remote work policies.",
            timestamp: new Date("2024-02-10T14:30:00"),
            sender: "Sarah Johnson",
            role: "user"
          },
          {
            id: "MSG-004",
            content: "I'll help you update the template. Here are the key areas we should address:\n\n1. Work hours and availability\n2. Equipment and expense policies\n3. Data security requirements\n4. Performance monitoring\n5. Communication expectations",
            timestamp: new Date("2024-02-10T14:35:00"),
            sender: "AI Assistant",
            role: "assistant"
          }
        ]
      }
    ],
    documents: [
      {
        id: "DOC-002",
        name: "employment_contract_template.docx",
        type: "application/docx",
        uploadedAt: new Date("2024-02-10"),
        size: 1500000
      }
    ],
    tags: ["employment", "template", "remote-work"]
  },
  {
    id: "CASE-003",
    title: "Patent Infringement Analysis",
    description: "Analysis of potential patent infringement claims in software development",
    client: {
      name: "Michael Chen",
      email: "m.chen@innovatech.com",
      company: "InnovaTech"
    },
    status: "active",
    priority: "high",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-19"),
    threads: [
      {
        id: "THR-003",
        title: "Initial Patent Review",
        status: "resolved",
        lastUpdated: new Date("2024-02-19"),
        messages: [
          {
            id: "MSG-005",
            content: "We've received a cease and desist letter regarding our image processing algorithm. Need urgent review.",
            timestamp: new Date("2024-02-01T09:15:00"),
            sender: "Michael Chen",
            role: "user"
          },
          {
            id: "MSG-006",
            content: "I've reviewed the patent claims and your algorithm implementation. Here's my initial analysis:\n\n1. The patent in question (US123456) covers a specific method of image processing\n2. Your implementation uses a different approach\n3. There are several prior art examples that may invalidate their claims\n\nRecommendation: Prepare a detailed response addressing these points.",
            timestamp: new Date("2024-02-01T09:30:00"),
            sender: "AI Assistant",
            role: "assistant"
          }
        ]
      }
    ],
    documents: [
      {
        id: "DOC-003",
        name: "patent_analysis.pdf",
        type: "application/pdf",
        uploadedAt: new Date("2024-02-01"),
        size: 3500000
      },
      {
        id: "DOC-004",
        name: "cease_and_desist.pdf",
        type: "application/pdf",
        uploadedAt: new Date("2024-02-01"),
        size: 1000000
      }
    ],
    tags: ["patent", "infringement", "urgent"]
  }
]; 