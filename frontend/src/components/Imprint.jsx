import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './Imprint.css';

function Imprint() {
    const [open, setOpen] = useState(false);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <>
            <button className="imprint-btn" onClick={() => setOpen(true)} aria-label="Imprint">
                Imprint
            </button>

            {open && (
                <div className="imprint-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Imprint">
                    <div className="imprint-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="imprint-header">
                            <h2 className="imprint-title">Imprint</h2>
                            <button className="imprint-close" onClick={() => setOpen(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="imprint-body">
                            <section>
                                <h3>Liability for Links</h3>
                                <p>
                                    Our offer includes links to external third party websites. We have no influence on the
                                    contents of those websites, therefore we cannot guarantee for those contents. Providers
                                    or administrators of linked websites are always responsible for their own contents.
                                </p>
                                <p>
                                    The linked websites had been checked for possible violations of law at the time of the
                                    establishment of the link. Illegal contents were not detected at the time of the linking.
                                    A permanent monitoring of the contents of linked websites cannot be imposed without
                                    reasonable indications that there has been a violation of law. Illegal links will be
                                    removed immediately at the time we get knowledge of them.
                                </p>
                            </section>

                            <section>
                                <h3>Copyright</h3>
                                <p>
                                    You are permitted to use, modify, and build upon the content from{' '}
                                    <a href="https://himankj.com" target="_blank" rel="noopener noreferrer">himankj.com</a>{' '}
                                    for both private and commercial purposes. This includes utilizing the information, ideas,
                                    articles, graphics, and designs provided, as long as appropriate credit is given to
                                    himankj.com and the original author, Himank Jain.
                                </p>
                            </section>

                            <section>
                                <h3>Attribution Requirements</h3>
                                <p>
                                    If you republish, reshare, or publicly display any content from{' '}
                                    <a href="https://himankj.com" target="_blank" rel="noopener noreferrer">himankj.com</a>,
                                    you must clearly attribute the work to Himank Jain and include a link to the original
                                    source. Modifications should be noted clearly if the original content has been altered
                                    significantly.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Imprint;
