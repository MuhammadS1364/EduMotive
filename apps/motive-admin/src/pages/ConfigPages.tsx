import CrudPage from '../components/CrudPage';
import SettingsForm from '../components/SettingsForm';
import { fmtDate, Rec } from '../lib/admin';

const bySort = (a: Rec, b: Rec) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

export function SectionsAdmin() {
  return <CrudPage table="sections" title="Article Sections" titleKey="name" visibleKey="visible" sort={bySort} defaults={{ visible: true }}
    subtitle={(r) => `Order ${r.sortOrder ?? 0}${r.visible ? '' : ' · hidden'}`}
    fields={[{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'sortOrder', label: 'Order', type: 'number' }, { key: 'visible', label: 'Visible on website', type: 'checkbox' }, { key: 'description', label: 'Description', type: 'textarea' }]} />;
}

export function IssuesAdmin() {
  return <CrudPage table="issues" title="Magazine Issues" titleKey="title" imageKey="coverImage" visibleKey="visible" defaults={{ visible: true }}
    sort={(a, b) => String(b.issueDate ?? '').localeCompare(String(a.issueDate ?? ''))} subtitle={(r) => fmtDate(r.issueDate)}
    fields={[{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'issueDate', label: 'Issue date', type: 'date', required: true }, { key: 'coverImage', label: 'Cover image', type: 'image' }, { key: 'pdfUrl', label: 'Issue PDF (flipbook)', type: 'file', required: true }, { key: 'visible', label: 'Visible', type: 'checkbox' }, { key: 'description', label: 'Description', type: 'textarea' }]} />;
}

export function AboutAdmin() {
  return (
    <div className="space-y-8">
      <SettingsForm title="About us" fields={[
        { key: 'aboutIntro', label: 'Describe yourselves', type: 'textarea' }, { key: 'vision', label: 'Vision', type: 'textarea' }, { key: 'mission', label: 'Mission', type: 'textarea' },
        { key: 'teamPhoto', label: 'Team photo', type: 'image' }, { key: 'teamPhotoCaption', label: 'Team photo caption', type: 'text' },
      ]} />
      <CrudPage table="teamMembers" title="Team Members" titleKey="name" imageKey="photo" sort={bySort} subtitle={(r) => r.designation ?? ''}
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true }, { key: 'designation', label: 'Post / designation', type: 'text', required: true },
          { key: 'photo', label: 'Photo', type: 'image' }, { key: 'sortOrder', label: 'Order', type: 'number' },
          { key: 'phone', label: 'Phone', type: 'text' }, { key: 'email', label: 'Email', type: 'email' },
          { key: 'instagram', label: 'Instagram URL', type: 'url' }, { key: 'facebook', label: 'Facebook URL', type: 'url' },
          { key: 'twitter', label: 'X / Twitter URL', type: 'url' }, { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
          { key: 'address', label: 'Postal address', type: 'textarea' }, { key: 'bio', label: 'About them', type: 'textarea' },
        ]} />
    </div>
  );
}

export function ProgramsAdmin() {
  return (
    <div className="space-y-8">
      <SettingsForm title="Website visibility" fields={[{ key: 'showPrograms', label: 'Show Programs section on website', type: 'checkbox' }]} />
      <CrudPage table="programs" title="Programs" titleKey="title" imageKey="image" visibleKey="visible" defaults={{ visible: true }}
        subtitle={(r) => `${r.mode ?? ''} · ${r.fee ? '₹' + r.fee : 'Free'}`}
        fields={[
          { key: 'title', label: 'Title', type: 'text', required: true }, { key: 'mode', label: 'Mode', type: 'select', options: ['Online', 'Offline', 'Hybrid', 'Other'] },
          { key: 'fee', label: 'Fee (₹, 0 = free)', type: 'number' }, { key: 'eventDate', label: 'Date', type: 'date' },
          { key: 'image', label: 'Image', type: 'image' }, { key: 'registrationLink', label: 'Registration link', type: 'url' },
          { key: 'visible', label: 'Visible', type: 'checkbox' },
          { key: 'description', label: 'Description', type: 'textarea' }, { key: 'eligibility', label: 'Eligibility', type: 'textarea' },
        ]} />
    </div>
  );
}

export function ResultsAdmin() {
  return (
    <div className="space-y-8">
      <SettingsForm title="Website visibility" fields={[{ key: 'showResults', label: 'Show Results section on website', type: 'checkbox' }]} />
      <CrudPage table="results" title="Results" titleKey="participant" visibleKey="visible" defaults={{ visible: true }}
        subtitle={(r) => `${r.programName ?? ''} · ${r.position ?? ''}`}
        fields={[
          { key: 'programName', label: 'Program', type: 'text', required: true }, { key: 'participant', label: 'Participant', type: 'text', required: true },
          { key: 'position', label: 'Position / grade', type: 'select', options: ['1st', '2nd', '3rd', 'A Grade', 'B Grade'], required: true },
          { key: 'institution', label: 'Institution', type: 'text' }, { key: 'visible', label: 'Visible', type: 'checkbox' },
        ]} />
    </div>
  );
}

export function NotesAdmin() {
  return <CrudPage table="notes" title="Notes" titleKey="title" sort={(a, b) => Number(!!b.pinned) - Number(!!a.pinned)}
    subtitle={(r) => `${r.pinned ? '📌 ' : ''}${r.content ?? ''}`}
    fields={[{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'color', label: 'Colour', type: 'select', options: ['Cream', 'Mint', 'Lavender', 'Violet'] }, { key: 'pinned', label: 'Pinned', type: 'checkbox' }, { key: 'content', label: 'Note', type: 'textarea' }]} />;
}

export function SiteAdmin() {
  return <SettingsForm title="Contact & social links" fields={[
    { key: 'contactEmail', label: 'Contact email', type: 'email' }, { key: 'instagram', label: 'Instagram URL', type: 'url' },
    { key: 'facebook', label: 'Facebook URL', type: 'url' }, { key: 'twitter', label: 'X URL', type: 'url' },
  ]} />;
}

export function AuthorsAdmin() {
  return <CrudPage table="profiles" title="Authors" titleKey="name" imageKey="avatar" defaults={{ role: 'Author' }}
    filter={(r) => r.role === 'Author'} sort={(a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''))}
    subtitle={(r) => [r.designation, r.institution].filter(Boolean).join(' · ')}
    fields={[
      { key: 'name', label: 'Name', type: 'text', required: true }, { key: 'designation', label: 'Post / designation', type: 'text' },
      { key: 'avatar', label: 'Photo', type: 'image' }, { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'bio', label: 'About the author', type: 'textarea' },
    ]} />;
}

export function HeroAdmin() {
  return <CrudPage table="heroSlides" title="Hero Banner Slides" titleKey="link" imageKey="image" visibleKey="visible" sort={bySort} defaults={{ visible: true }}
    subtitle={(r) => `Slide ${r.sortOrder ?? 0}${r.visible ? '' : ' · hidden'}`}
    fields={[{ key: 'image', label: 'Banner image (wide, e.g. 1920×700)', type: 'image', required: true, full: true }, { key: 'link', label: 'Link when clicked (optional)', type: 'url' }, { key: 'sortOrder', label: 'Order', type: 'number' }, { key: 'visible', label: 'Show on website', type: 'checkbox' }]} />;
}
