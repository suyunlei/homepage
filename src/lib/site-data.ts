import fs from 'node:fs';
import path from 'node:path';

export interface HomeColumn {
  bottom: boolean;
  images: string[];
}

export interface HomePanel {
  menuLabel: string;
  title: string;
  subtitle: string;
  image: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface ChatNote {
  side: 'visitor' | 'ray';
  text: string;
}

export interface SiteData {
  siteTitle: string;
  siteDescription: string;
  heroFrameTitle: string;
  heroFrameSubtitle: string;
  owner: {
    nameZh: string;
    nameEn: string;
    nickname: string;
    handle: string;
    tagline: string;
    location: string;
    avatar: string;
  };
  homeColumns: HomeColumn[];
  homePanels: HomePanel[];
  contact: {
    introQuote: string;
    bioLine: string;
    email: string;
    githubUrl: string;
    weiboUrl: string;
    scholarUrl: string;
    orcidUrl: string;
    wechatQr: string;
    wechatId: string;
    wechatHint: string;
    miniProgramNote: string;
    office?: string;
    chatNotes: ChatNote[];
  };
}

export interface ResearchInterest {
  code: string;
  title: string;
  titleZh: string;
  summary: string;
  keywords: string[];
}

export interface EducationEntry {
  period: string;
  institution: string;
  location: string;
  degree: string;
  details: string;
}

export interface ExperienceEntry {
  period: string;
  organization: string;
  location: string;
  role: string;
  details: string;
  highlights?: string[];
}

export interface HonorEntry {
  year: string;
  title: string;
  role: string;
  note: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface CvData {
  position: string;
  affiliation: string;
  cvPdf: string;
  bioParagraphs: string[];
  researchInterests: ResearchInterest[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  honorsAndProjects: HonorEntry[];
  serviceAndSkills: SkillGroup[];
}

interface PrivateOverrides {
  email?: string;
  affiliation?: string;
  position?: string;
  scholarUrl?: string;
  orcidUrl?: string;
  cvPdf?: string;
  wechatId?: string;
  wechatQr?: string;
  office?: string;
}

function getContentRoot(): string {
  const customRoot = process.env.CONTENT_DIR?.trim();
  return customRoot ? path.resolve(customRoot) : path.resolve(process.cwd(), 'content');
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function readPrivateOverrides(contentRoot: string): PrivateOverrides {
  const overridePath = path.join(contentRoot, 'private.local.json');
  if (!fs.existsSync(overridePath)) {
    return {};
  }
  try {
    return readJsonFile<PrivateOverrides>(overridePath);
  } catch {
    return {};
  }
}

export function loadSiteAndCvData(): { site: SiteData; cv: CvData } {
  const contentRoot = getContentRoot();
  const site = readJsonFile<SiteData>(path.join(contentRoot, 'site.json'));
  const cv = readJsonFile<CvData>(path.join(contentRoot, 'academic', 'cv.json'));
  const priv = readPrivateOverrides(contentRoot);

  if (priv.email?.trim()) site.contact.email = priv.email.trim();
  if (priv.scholarUrl?.trim()) site.contact.scholarUrl = priv.scholarUrl.trim();
  if (priv.orcidUrl?.trim()) site.contact.orcidUrl = priv.orcidUrl.trim();
  if (priv.wechatId?.trim()) site.contact.wechatId = priv.wechatId.trim();
  if (priv.wechatQr?.trim()) site.contact.wechatQr = priv.wechatQr.trim();
  if (priv.office?.trim()) site.contact.office = priv.office.trim();

  if (priv.affiliation?.trim()) cv.affiliation = priv.affiliation.trim();
  if (priv.position?.trim()) cv.position = priv.position.trim();
  if (priv.cvPdf?.trim()) cv.cvPdf = priv.cvPdf.trim();

  return { site, cv };
}

/**
 * Shift each character code by +3 so static HTML does not expose a raw plaintext email.
 */
export function encodeEmailForClient(email: string): number[] {
  return Array.from(email).map((ch) => ch.charCodeAt(0) + 3);
}
