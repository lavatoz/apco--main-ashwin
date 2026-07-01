import React, { useMemo } from 'react';
import { type TemplateProps } from '../types';
import { replaceAgreementPlaceholders } from '../../utils/agreementUtils';

export const WeddingAgreement: React.FC<TemplateProps> = ({ company, client, document, agreement }) => {
  const isAgreed = agreement?.status === 'accepted';
  
  // Dynamic Placeholder Extraction
  const clientName = client?.name || client?.projectName || document?.clientName || document?.client?.name || agreement?.quotation?.clientName || 'Valued Client';
  const eventName = document?.eventName || client?.projectName || agreement?.quotation?.eventName || 'Wedding Photography & Videography';
  const rawEventDate = document?.eventDate || (client?.events && client.events[0]?.date) || client?.weddingDate || client?.eventDate || agreement?.quotation?.eventDate || '';
  const formattedEventDate = rawEventDate ? new Date(rawEventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'As Scheduled';
  
  const rawTodayDate = agreement?.assignedAt || agreement?.createdAt || agreement?.acceptedAt || new Date();
  const todayDateStr = new Date(rawTodayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const rawTotal = document?.totalAmount ?? document?.amount ?? document?.total ?? agreement?.quotation?.totalAmount;
  const rawAdvance = document?.paidAmount ?? document?.advanceAmount ?? agreement?.quotation?.advanceAmount;
  const rawBalance = (rawTotal !== undefined && rawAdvance !== undefined) 
    ? Number(rawTotal) - Number(rawAdvance) 
    : (document?.balanceAmount ?? agreement?.quotation?.balanceAmount);

  const formattedTotal = rawTotal !== undefined && rawTotal !== null && rawTotal !== '' ? `Rs. ${Number(rawTotal).toLocaleString('en-IN')}` : 'Specified in Quotation';
  const formattedAdvance = rawAdvance !== undefined && rawAdvance !== null && rawAdvance !== '' ? `Rs. ${Number(rawAdvance).toLocaleString('en-IN')}` : 'As per Milestone Schedule';
  const formattedBalance = rawBalance !== undefined && rawBalance !== null && rawBalance !== '' ? `Rs. ${Number(rawBalance).toLocaleString('en-IN')}` : 'Due upon Final Delivery';

  const agreementRef = document?.id || agreement?.linkedQuoteId || agreement?.id || 'AK-WPA-2026';
  const agreementVersion = agreement?.version ? `v${agreement.version}.0` : 'v1.0';

  const processedBody = useMemo(() => {
    if (!agreement?.body) return '';
    return replaceAgreementPlaceholders(agreement.body, {
      company,
      client,
      quotation: document,
      agreement,
    });
  }, [agreement, company, client, document]);

  // Standard terms fallback if agreement.body is not populated
  const defaultTerms = [
    {
      id: "1",
      title: "1. Booking & Payment Policy",
      bullets: [
        { label: "Advance:", text: "To confirm the booking and secure the date, a non-refundable advance amount—as specified in the quotation or invoice—must be paid." },
        { label: "Main Payment:", text: "The payment schedule and milestone amounts must be cleared strictly as specified in the quotation or invoice provided to the client." },
        { label: "Final Settlement:", text: "The remaining balance as per the invoice is strictly due on the day the final outputs, including the album, are handed over. The team will notify the client a few days prior to the final delivery so that the final payment can be arranged in advance. Even if work is completed earlier than the expected timeline, the client must be ready to clear the payment upon delivery." },
        { label: "Extra Charges:", text: "Any additional costs incurred for extended album leaflets or newly requested services will be collected either prior to the service, immediately after the event, or added to the final settlement." }
      ]
    },
    {
      id: "2",
      title: "2. Delivery Timeline",
      bullets: [
        { label: "Standard Timeline & Delays:", text: "The timelines provided below represent our standard delivery schedules. Some deliverable dates could change due to natural reasons or unforeseen circumstances. If there is any such unexpected delay, our team will proactively inform the client." },
        { label: "Social Media Highlights & Reels:", text: "Highlight photos will be delivered on the day of the event or the following day. Certain video deliverables like Reels, Highlights, or Documentaries are typically delivered within 1 to 2 weeks. This timeline is subject to change, but our team will make the absolute maximum effort to provide them as early as possible. If there are any schedule changes or unexpected delays, we will notify the client proactively." },
        { label: "Graded Photos:", text: "The remaining key photos will be color-graded and delivered within one week." },
        { label: "Final Delivery:", text: "All deliverables, including videos, reels, and the physical album, can be handed over anywhere from the 1st week up to a maximum of 14 weeks from the event date. While it may occasionally take the full 14 weeks, our team will make the absolute maximum effort to work as fast as possible without any unnecessary delays." }
      ]
    },
    {
      id: "3",
      title: "3. Editing, Photo Selection & Corrections",
      bullets: [
        { label: "Photo Selection & Album Design:", text: "Our team will manually select the best shots for the couple and individual portraits. However, for family and guest photos, we may send a gallery to the client for sorting. While it is not mandatory in every single case, when required, the client must choose their preferred family photos. The official timeline for album design will strictly begin only from the date the client submits their final selected photos." },
        { label: "Album Corrections:", text: "Once the initial layout is ready, a maximum of 1 or 2 rounds of corrections (adding/removing photos) are permitted. Once confirmed, it will be color-graded and sent for printing. Printing and delivery will take 3 to 15 days. Extra album leaflets will incur additional charges starting from a minimum of ₹250 per leaflet (Charges may apply depending on the specific package and design quality)." },
        { label: "Video Editing:", text: "Song suggestions for the video editing must be provided by the client on or before the event day. The team will make the maximum effort to use the suggested tracks; however, if a song does not suit the flow or style of the video, it will not be used. Songs cannot be changed once editing is complete." },
        { label: "Artistic Control:", text: "While the team will try to accommodate requests, specific poses cannot be guaranteed. The final selection of the best shots and overall creative control remains strictly with the photography/videography team." }
      ]
    },
    {
      id: "4",
      title: "4. Data Storage & Backup",
      bullets: [
        { label: "", text: "RAW photos and videos, along with the final output data, will be uploaded to Google Photos for lifetime access. However, RAW files (photos and videos) will only be provided if agreed upon and explicitly mentioned in the quotation." },
        { label: "Client Backup:", text: "It is the client's full responsibility to download and keep personal backups of all files." },
        { label: "", text: "If the client requires the data in a physical hard drive, they must provide the hard drive or cover the cost so it can be copied and provided directly to the client." }
      ]
    },
    {
      id: "5",
      title: "5. Location, Logistics & Permission",
      bullets: [
        { label: "Location & Travel Charges:", text: "Package pricing is originally calculated based on the main event venue and mutually convenient, nearby shoot locations. If a location is chosen that requires extensive travel, significant extra time, or is located far away (especially if decided after the initial booking), additional travel and time charges will apply." },
        { label: "", text: "If our team chooses the photoshoot location, we will handle the permissions, but any shoot fees or entry charges must be borne by the client. The client must arrange prior permissions for locations chosen by them." },
        { label: "", text: "The client agrees to provide adequate meals for the technical crew during the event coverage. If the client is unable to arrange or provide food for the crew, they must strictly inform the team beforehand so alternative arrangements can be made." }
      ]
    },
    {
      id: "6",
      title: "6. Exclusivity, Crew Safety & Issue Resolution",
      bullets: [
        { label: "", text: "The assigned crew will have absolute control over the photography and videography for the event. The client must ensure guests or unauthorized professionals do not obstruct the team or interfere with their duties." },
        { label: "", text: "The client must provide a safe working environment. The team holds the right to stop work in case of any crew harassment or unsafe conditions." },
        { label: "Issue Resolution:", text: "If the client anticipates any potential risks or problems, or if they face any difficulties from the crew's side, they must inform the Team Lead in advance or exactly when the issue occurs. This will allow the team to take appropriate decisions and actions immediately." }
      ]
    },
    {
      id: "7",
      title: "7. Overtime & Extra Services",
      bullets: [
        { label: "", text: "Our standard coverage spans around 7 to 8 hours depending upon the work schedule. If the event extends beyond this, extra overtime charges may apply. We handle overtime understandingly—meaning we evaluate the situational workflow, and it is not always strictly charged (charges are evaluated on a case-by-case basis depending on the extent of the delay and the additional effort required). However, if extra hours are known or planned beforehand, the client must inform the team in advance. If unexpected overtime occurs on the event day and warrants an extra charge, a crew member will actively notify the client on-site, and the charges will be added to the final payment settlement." }
      ]
    },
    {
      id: "8",
      title: "8. Cancellation & Rescheduling",
      bullets: [
        { label: "Cancellation:", text: "If the event is canceled, the advance paid is non-refundable. Additionally, non-refundable advances paid by the team to other personnel or vendors will also not be returned." },
        { label: "Rescheduling:", text: "If the event has to be rescheduled, the advance will be adjusted to the new date only if the team’s schedule allows. Otherwise, the advance is generally non-refundable, though we may review the situation and potentially offer a partial or full refund depending on the circumstances." }
      ]
    },
    {
      id: "9",
      title: "9. Promotional Rights & Privacy",
      bullets: [
        { label: "", text: "The works may be used for the portfolios, websites, or social media promotions of the Service Provider and the parent company, Artisans Production Company, or any of its subsidiaries. This creative promotional right remains with Artisans Production Company for all time and across any period in the future." },
        { label: "", text: "If the client does not wish for their photos or videos to be shared publicly, they must strictly inform the team beforehand so their privacy can be fully respected." }
      ]
    },
    {
      id: "10",
      title: "10. Privacy & Data Sharing",
      bullets: [
        { label: "", text: "The cloud storage link will be shared exclusively with the main client. The team holds no responsibility or liability if the client shares this link with third parties." }
      ]
    },
    {
      id: "11",
      title: "11. Service Verification & Refunds",
      bullets: [
        { label: "", text: "The client has the right to request a refund for any specific services or items explicitly mentioned in the invoice or quotation that were not provided." },
        { label: "", text: "It is the sole right and responsibility of the client to cross-check and ensure that all deliverables and services promised have been fully received. The client must exercise this right to verify everything before or at the time of final delivery." },
        { label: "", text: "Any missing items or unfulfilled services must be reported either before or exactly on the day of the final delivery. If the client fails to notify us by this time, the team will hold absolutely no responsibility or liability for any claims made after the final delivery date." }
      ]
    }
  ];

  return (
    <div className="bg-white text-[#111111] w-full max-w-4xl mx-auto border border-[#EAEAEA] rounded-none shadow-none font-sans p-8 md:p-14 space-y-12 selection:bg-amber-100">
      
      {/* ────────────────── PAGE 1: HEADER & INFO CARDS ────────────────── */}
      <div className="space-y-8">
        {/* Logos Header */}
        <div className="flex justify-between items-center pb-6 border-b border-[#EAEAEA]">
          {/* Left: Aaha Kalyanam logo */}
          <div className="flex items-center">
            <img 
              src="/assets/aaha_wedding_logo.png" 
              alt="Aaha Kalyanam" 
              className="h-14 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-serif text-xl font-bold tracking-wider text-zinc-900 hidden">AAHA KALYANAM</span>
          </div>

          {/* Right: Artisans Production Company logo */}
          <div className="flex items-center">
            <img 
              src="/assets/artisans_logo.png" 
              alt="Artisans Production Company" 
              className="h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Brand Hierarchy Header */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-zinc-900 font-serif">AAHA KALYANAM</h1>
          <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-zinc-500">Operating Brand of</p>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-800">ARTISANS PRODUCTION COMPANY</p>
        </div>

        {/* Centered Title with Gold Accent & Divider */}
        <div className="text-center pt-4">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold tracking-wide text-zinc-900 uppercase leading-tight">
            WEDDING PHOTOGRAPHY &<br />VIDEOGRAPHY AGREEMENT
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mt-4 mb-2" />
          <div className="border-b border-[#EAEAEA] w-full mt-4" />
        </div>

        {/* Two Elegant Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* LEFT CARD: Client Details */}
          <div className="border border-[#EAEAEA] p-6 rounded-none bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] pb-2 border-b border-[#EAEAEA]">
              Client Details
            </h3>
            <div className="text-sm space-y-1.5 leading-[1.6] text-zinc-800">
              <p><span className="font-semibold text-zinc-900">Client Name(s):</span> {clientName}</p>
              {client?.email && <p><span className="font-semibold text-zinc-900">Email:</span> {client.email}</p>}
              {client?.phone && <p><span className="font-semibold text-zinc-900">Phone:</span> {client.phone}</p>}
              {client?.address && <p><span className="font-semibold text-zinc-900">Address:</span> {client.address}</p>}
            </div>
          </div>

          {/* RIGHT CARD: Agreement Details */}
          <div className="border border-[#EAEAEA] p-6 rounded-none bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] pb-2 border-b border-[#EAEAEA]">
              Agreement Details
            </h3>
            <div className="text-sm space-y-1.5 leading-[1.6] text-zinc-800">
              <p><span className="font-semibold text-zinc-900">Agreement Ref:</span> {agreementRef}</p>
              <p><span className="font-semibold text-zinc-900">Issue Date:</span> {todayDateStr}</p>
              <p><span className="font-semibold text-zinc-900">Version:</span> {agreementVersion}</p>
              <p><span className="font-semibold text-zinc-900">Legal Entity:</span> Artisans Production Company</p>
            </div>
          </div>
        </div>

        {/* Event Details Section */}
        <div className="border border-[#EAEAEA] p-6 rounded-none bg-white space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] pb-2 border-b border-[#EAEAEA]">
            Event Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm leading-[1.6] text-zinc-800">
            <p><span className="font-semibold text-zinc-900">Booking For (Main Event):</span> {eventName}</p>
            <p><span className="font-semibold text-zinc-900">Main Event Date:</span> {formattedEventDate}</p>
            {client?.venueAddress && <p className="md:col-span-2"><span className="font-semibold text-zinc-900">Venue Location:</span> {client.venueAddress}</p>}
          </div>
        </div>

        {/* Financial Details Section */}
        <div className="border border-[#EAEAEA] p-6 rounded-none bg-white space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059] pb-2 border-b border-[#EAEAEA]">
            Financial Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-[1.6] text-zinc-800">
            <div>
              <span className="block text-xs uppercase tracking-wider text-zinc-500">Total Package Amount</span>
              <span className="font-bold text-base text-zinc-900">{formattedTotal}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider text-zinc-500">Advance Amount Paid</span>
              <span className="font-semibold text-base text-zinc-900">{formattedAdvance}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider text-zinc-500">Balance Settlement</span>
              <span className="font-bold text-base text-[#C5A059]">{formattedBalance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── PAGES 2–3: LEGAL DOCUMENT LAYOUT ────────────────── */}
      <div className="pt-6 space-y-10">
        <div className="pb-3 border-b-2 border-zinc-900 flex justify-between items-end">
          <h3 className="text-xl font-serif font-bold tracking-wide text-zinc-900 uppercase">
            HOW WE WORK: SERVICE TERMS & CONDITIONS
          </h3>
          <span className="text-xs font-semibold text-[#C5A059] tracking-widest uppercase">Legal Terms</span>
        </div>

        {processedBody ? (
          <div className="whitespace-pre-wrap text-sm text-zinc-800 leading-[1.6] space-y-6 font-sans">
            {processedBody}
          </div>
        ) : (
          <div className="space-y-8 font-sans">
            {defaultTerms.map((section) => (
              <div key={section.id} className="space-y-3">
                {/* Large bold section heading */}
                <h4 className="text-base font-semibold text-zinc-900 tracking-wide pt-2">
                  <span className="text-[#C5A059] font-mono font-bold mr-1.5">{section.title.split('.')[0]}.</span>
                  {section.title.split('.').slice(1).join('.').trim()}
                </h4>
                {/* Thin divider */}
                <div className="border-b border-[#EAEAEA] w-full" />
                {/* Body text / bullet points with line height 1.6 */}
                <div className="space-y-3 pl-2 pt-1">
                  {section.bullets.map((bullet, idx) => (
                    <div key={idx} className="text-sm text-zinc-800 leading-[1.6] flex items-start gap-2">
                      <span className="text-[#C5A059] mt-1 text-xs">●</span>
                      <div>
                        {bullet.label && <strong className="font-semibold text-zinc-900 mr-1.5">{bullet.label}</strong>}
                        <span>{bullet.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ────────────────── LAST PAGE: DECLARATION & SIGNATURES ────────────────── */}
      <div className="pt-8 space-y-10">
        {/* Final Agreement Declaration Paragraph */}
        <div className="p-5 border-l-2 border-[#C5A059] bg-zinc-50/60 text-sm font-semibold text-zinc-900 leading-[1.6]">
          I have read, understand and agree to the terms and conditions of this Agreement.
        </div>

        {/* Premium Signature Section (Two-column layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-[#EAEAEA]">
          
          {/* LEFT: CLIENT */}
          <div className="space-y-6 flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">CLIENT</h5>
              {/* Client signature left blank as required */}
              <div className="border-b border-zinc-300 h-24 mb-4 flex items-end pb-2">
                <span className="text-xs text-zinc-400 italic">Client Signature & Seal</span>
              </div>
            </div>
            <div className="text-xs space-y-1.5 text-zinc-800">
              <p><span className="font-semibold text-zinc-900">Name:</span> {clientName}</p>
              <p><span className="font-semibold text-zinc-900">Date:</span> {isAgreed && agreement?.acceptedAt ? new Date(agreement.acceptedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '____________________'}</p>
            </div>
          </div>

          {/* RIGHT: SERVICE PROVIDER */}
          <div className="space-y-6 flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">SERVICE PROVIDER</h5>
              {/* Company owner's uploaded signature image (No empty signature line) */}
              <div className="h-24 flex items-end pb-2">
                {company?.signature ? (
                  <img src={company.signature} alt="Owner Signature" className="h-16 object-contain" />
                ) : (
                  /* Elegant SVG digital signature representation fallback */
                  <svg viewBox="0 0 300 80" className="h-16 w-48 text-zinc-900 fill-none stroke-current stroke-2">
                    <path d="M 10 60 C 30 20, 50 70, 70 30 C 80 10, 90 50, 110 40 C 130 30, 120 70, 150 20 C 170 10, 180 50, 200 35 C 220 20, 240 60, 280 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div className="text-xs space-y-1 text-zinc-800 pt-2 border-t border-zinc-200">
              <p className="font-bold uppercase tracking-wider text-zinc-900">Authorized Signatory</p>
              <p className="font-bold text-zinc-900 uppercase tracking-wide">ARTISANS PRODUCTION COMPANY</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Operating Brand: AAHA KALYANAM</p>
              
              {/* Artisans Production Company Logo */}
              <div className="pt-3">
                <img 
                  src="/assets/artisans_logo.png" 
                  alt="Artisans Production Company Logo" 
                  className="h-7 object-contain opacity-85" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────── FOOTER (EVERY PAGE DISPLAY) ────────────────── */}
      <div className="pt-8 mt-12 border-t border-[#EAEAEA] text-[11px] text-zinc-500 font-sans flex flex-col md:flex-row justify-between items-center gap-3">
        <div>
          <span className="font-semibold text-zinc-900">Aaha Kalyanam</span> • Wedding Brand of Artisans Production Company
        </div>
        <div className="text-center">
          {company?.website || 'www.aahakalyanam.com'} • {company?.email || 'info@artisans.co'} • {company?.phone || '+91 98765 43210'}
        </div>
        <div className="font-medium text-zinc-400">
          Page 1 of 4
        </div>
      </div>

    </div>
  );
};

