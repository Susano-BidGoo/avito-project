import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/theme';
import { ThemeToggle } from '../components/ThemeToggle';
import lampUrl from '../assets/Lamp.svg';
import replayUrl from '../assets/Replay.svg';
import starUrl from '../assets/Star.svg';
import positiveNotifUrl from '../assets/Positive notification.svg';
import negativeNotifUrl from '../assets/Negative Notice.svg';
import loadingUrl from '../assets/Loading.svg';

//Types

type Category = 'auto' | 'real_estate' | 'electronics';

interface AutoParams {
    brand?: string;
    model?: string;
    yearOfManufacture?: number | '';
    transmission?: 'automatic' | 'manual' | '';
    mileage?: number | '';
    enginePower?: number | '';
}

interface RealEstateParams {
    type?: 'flat' | 'house' | 'room' | '';
    address?: string;
    area?: number | '';
    floor?: number | '';
}

interface ElectronicsParams {
    type?: 'phone' | 'laptop' | 'misc' | '';
    brand?: string;
    model?: string;
    condition?: 'new' | 'used' | '';
    color?: string;
}

type ItemParams = AutoParams | RealEstateParams | ElectronicsParams;

interface AdItem {
    id: string;
    category: Category;
    title: string;
    price: number;
    description?: string;
    params?: ItemParams;
}

interface FormState {
    category: Category | '';
    title: string;
    price: string;
    description: string;
    params: ItemParams;
}

//Constants

const API_BASE = '/api';
const OLLAMA_BASE = 'http://localhost:11434';

//Helpers

function getDraftKey(id: string) {
    return `ad_draft_${id}`;
}

function isFormValid(form: FormState): boolean {
    return form.category !== '' && form.title.trim() !== '' && form.price.trim() !== '' && Number(form.price) > 0;
}

//Styles

function fieldWrapStyle(): React.CSSProperties {
    return { display: 'flex', flexDirection: 'column', gap: 4 };
}

function labelStyle(dark: boolean): React.CSSProperties {
    return {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 400,
        fontSize: 14,
        color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    };
}

function inputStyle(hasError: boolean, hasWarning = false, dark = false): React.CSSProperties {
    return {
        width: 456,
        boxSizing: 'border-box' as const,
        padding: '6px 12px',
        borderRadius: 8,
        border: hasError
            ? '1px solid #EC221F'
            : hasWarning
                ? '1px solid #FAAD14'
                : dark ? '1px solid #434343' : '1px solid #D9D9D9',
        fontFamily: 'Roboto, sans-serif',
        fontSize: 14,
        color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
        outline: 'none',
        background: dark ? '#2a2a2a' : '#FFFFFF',
        height: 32,
    };
}

function selectStyle(hasError: boolean, hasWarning = false, dark = false): React.CSSProperties {
    return {
        ...inputStyle(hasError, hasWarning, dark),
        appearance: 'none' as const,
        WebkitAppearance: 'none' as const,
        cursor: 'pointer',
    };
}

function errorText(msg: string) {
    return (
        <span style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            fontSize: 12,
            lineHeight: '20px',
            color: '#EC221F',
        }}>
            {msg}
        </span>
    );
}

function Divider({ isDark }: { isDark: boolean }) {
    return (
        <div style={{
            width: 'calc(100vw - 64px)',
            maxWidth: 1036,
            height: 1,
            background: isDark ? '#303030' : '#F0F0F0',
        }} />
    );
}

//AI Tooltip

interface AiTooltipProps {
    result: string | null;
    error: string | null;
    onApply?: () => void;
    onClose: () => void;
    isDark?: boolean;
}

function AiTooltip({ result, error, onApply, onClose, isDark = false }: AiTooltipProps) {
    if (!result && !error) return null;

    if (error) {
        return (
            <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: 8,
                zIndex: 100,
                width: 332,
            }}>
                <div style={{
                    background: '#FEE9E7',
                    borderRadius: 2,
                    padding: 8,
                    gap: 8,
                    display: 'flex',
                    boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.15)',
                    flexDirection: 'column',
                    boxSizing: 'border-box' as const,
                    position: 'relative',
                }}>
                    <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 12, lineHeight: '18px', color: '#C00F0C' }}>
                        Произошла ошибка при запросе к AI
                    </p>
                    <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 12, lineHeight: '18px', color: '#1E1E1E' }}>
                        Попробуйте повторить запрос или закройте уведомление
                    </p>
                    <div>
                        <button onClick={onClose} style={{
                            background: '#FCB3AD', color: 'rgba(0,0,0,0.85)', border: '1px solid #D9D9D9',
                            borderRadius: 4, padding: '0px 7px', height: 24, cursor: 'pointer',
                            fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px',
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                        }}>
                            Закрыть
                        </button>
                    </div>
                    <div style={{
                        position: 'absolute', bottom: -8, left: 20, width: 0, height: 0,
                        borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                        borderTop: '8px solid #FEE9E7', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.08))',
                    }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 100, width: 320 }}>
            <div style={{
                background: isDark ? '#2a2a2a' : '#fff',
                borderRadius: 2,
                boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.15)',
                padding: '10px 12px 12px', position: 'relative', boxSizing: 'border-box' as const,
            }}>
                <p style={{ margin: '0 0 6px 0', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 13, lineHeight: '20px', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}>
                    Ответ AI:
                </p>
                <p style={{ margin: '0 0 8px 0', fontFamily: 'Roboto, sans-serif', fontSize: 12, lineHeight: '18px', color: isDark ? '#E0E0E0' : '#1E1E1E', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {result}
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                    {onApply && (
                        <button onClick={onApply} style={{ background: '#1890FF', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 13, lineHeight: '20px' }}>
                            Применить
                        </button>
                    )}
                    <button onClick={onClose} style={{ background: isDark ? '#3a3a3a' : '#fff', color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', border: isDark ? '1px solid #434343' : '1px solid #D9D9D9', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 13, lineHeight: '20px' }}>
                        Закрыть
                    </button>
                </div>
                <div style={{
                    position: 'absolute', bottom: -8, left: 20, width: 0, height: 0,
                    borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                    borderTop: isDark ? '8px solid #2a2a2a' : '8px solid #fff',
                    filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.08))',
                }} />
            </div>
        </div>
    );
}

//AI Button

type AiStatus = 'idle' | 'loading' | 'done';

interface AiButtonProps {
    idleLabel: string;
    loading: boolean;
    done: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function AiButton({ idleLabel, loading, done, onClick, disabled }: AiButtonProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const label = loading ? 'Выполняется запрос' : done ? 'Повторить запрос' : idleLabel;
    const icon = done ? replayUrl : lampUrl;

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                borderRadius: 8, border: 'none',
                background: isDark ? '#2D2000' : '#F9F1E6',
                cursor: loading || disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', flexShrink: 0,
            }}
        >
            {loading ? (
                <img src={loadingUrl} alt="" width={14} height={14} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', flexShrink: 0 }} />
            ) : (
                <img src={icon} alt="" width={14} height={14} />
            )}
            <span style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '22px', color: isDark ? '#FFD666' : '#FFA940' }}>
                {label}
            </span>
        </button>
    );
}

//Notification

function Notification({ type }: { type: 'success' | 'error' }) {
    return (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
            <img
                src={type === 'success' ? positiveNotifUrl : negativeNotifUrl}
                alt={type === 'success' ? 'Изменения сохранены' : 'Ошибка сохранения'}
                style={{ display: 'block', height: type === 'success' ? 40 : 118 }}
            />
        </div>
    );
}

//FieldRow

function FieldRow({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}>
                {label}
            </label>
            {children}
        </div>
    );
}

function ClearableInput({ value, onChange, placeholder, hasError, hasWarning, type = 'text', dark = false }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hasError?: boolean;
    hasWarning?: boolean;
    type?: string;
    dark?: boolean;
}) {
    return (
        <div style={{ position: 'relative', width: 456 }}>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ ...inputStyle(!!hasError, !!hasWarning, dark), width: '100%', paddingRight: value ? 32 : 12 }}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        width: 14, height: 14, borderRadius: '50%', background: dark ? '#ffffff40' : '#00000040',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 0, flexShrink: 0,
                    }}
                >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
            )}
        </div>
    );
}

function SelectArrow() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
             style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path d="M2 4l4 4 4-4" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

//Page

export default function AdEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<'success' | 'error' | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState<FormState>({
        category: '',
        title: '',
        price: '',
        description: '',
        params: {},
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [descAiStatus, setDescAiStatus] = useState<AiStatus>('idle');
    const [descAiResult, setDescAiResult] = useState<string | null>(null);
    const [descAiError, setDescAiError] = useState<string | null>(null);
    const descAbortRef = useRef<AbortController | null>(null);

    const [priceAiStatus, setPriceAiStatus] = useState<AiStatus>('idle');
    const [priceAiResult, setPriceAiResult] = useState<string | null>(null);
    const [priceAiError, setPriceAiError] = useState<string | null>(null);
    const priceAbortRef = useRef<AbortController | null>(null);

    //Загрузка данных
    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        setLoading(true);

        fetch(`${API_BASE}/items/${id}`, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`Ошибка ${res.status}`);
                return res.json();
            })
            .then((raw: unknown) => {
                const data = (raw as { items?: AdItem[] }).items?.length
                    ? (raw as { items: AdItem[] }).items[0]
                    : raw as AdItem;

                if (!data) {
                    setError('Объявление не найдено');
                    return;
                }

                const serverForm: FormState = {
                    category: data.category,
                    title: data.title,
                    price: String(data.price),
                    description: data.description ?? '',
                    params: data.params ?? {},
                };

                const sessionKey = `editing_${id}`;
                const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const isReload = navEntry?.type === 'reload';
                const wasEditing = isReload && sessionStorage.getItem(sessionKey);

                if (wasEditing) {
                    const draftRaw = localStorage.getItem(getDraftKey(id));
                    if (draftRaw) {
                        try {
                            const draft = JSON.parse(draftRaw) as FormState;
                            setForm(draft);
                            setLoading(false);
                        } catch {
                            localStorage.removeItem(getDraftKey(id));
                            setForm(serverForm);
                            setLoading(false);
                        }
                    } else {
                        setForm(serverForm);
                        setLoading(false);
                    }
                } else {
                    localStorage.removeItem(getDraftKey(id));
                    sessionStorage.setItem(sessionKey, '1');
                    setForm(serverForm);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError('Не удалось загрузить объявление. Проверьте что сервер запущен.');
                    setLoading(false);
                }
            });

        return () => { controller.abort(); };
    }, [id]);

    //Черновик
    useEffect(() => {
        if (!id || loading) return;
        localStorage.setItem(getDraftKey(id), JSON.stringify(form));
    }, [form, id, loading]);

    //Смена категории
    function handleCategoryChange(cat: Category) {
        setForm(f => ({ ...f, category: cat, params: {} }));
    }

    function setParam(key: string, value: string | number) {
        setForm(f => ({ ...f, params: { ...f.params, [key]: value } }));
    }

    //Сохранение
    async function handleSave() {
        setSubmitted(true);
        if (!isFormValid(form) || !id) return;

        setSaving(true);
        try {
            const body = {
                category: form.category,
                title: form.title.trim(),
                price: Number(form.price),
                description: form.description || undefined,
                params: form.params,
            };

            const res = await fetch(`${API_BASE}/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`Ошибка ${res.status}`);

            localStorage.removeItem(getDraftKey(id));
            sessionStorage.removeItem(`editing_${id}`);
            setNotification('success');
            setTimeout(() => navigate(`/ads/${id}`), 1500);
        } catch {
            setNotification('error');
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setSaving(false);
        }
    }

    //AI
    async function callOllama(prompt: string, signal: AbortSignal): Promise<string> {
        const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama3', prompt, stream: false }),
            signal,
        });
        if (!res.ok) throw new Error(`Ollama error ${res.status}`);
        const data = await res.json();
        return data.response as string;
    }

    function buildContext() {
        const categoryLabels: Record<string, string> = {
            auto: 'Авто', real_estate: 'Недвижимость', electronics: 'Электроника',
        };
        const params = Object.entries(form.params)
            .filter(([, v]) => v !== '' && v !== undefined)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        return `Название: "${form.title}", категория: ${categoryLabels[form.category] ?? form.category}, цена: ${form.price} руб.${params ? `, характеристики: ${params}` : ''}`;
    }

    async function handleDescAi() {
        descAbortRef.current?.abort();
        descAbortRef.current = new AbortController();
        setDescAiStatus('loading');
        setDescAiResult(null);
        setDescAiError(null);

        const action = form.description ? 'улучши описание' : 'придумай описание';
        const prompt = `${buildContext()}. ${action} для этого объявления. Отвечай только на русском языке. Ответь только текстом описания без вводных слов, без упоминания параметров в формате ключ:значение, не более 1000 символов`;

        try {
            const result = await callOllama(prompt, descAbortRef.current.signal);
            setDescAiResult(result.trim());
            setDescAiStatus('done');
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setDescAiError('Не удалось получить ответ от AI');
                setDescAiStatus('done');
            }
        }
    }

    async function handlePriceAi() {
        priceAbortRef.current?.abort();
        priceAbortRef.current = new AbortController();
        setPriceAiStatus('loading');
        setPriceAiResult(null);
        setPriceAiError(null);

        const prompt = `${buildContext()}. Определи рыночную цену для этого объявления в России. Ответь строго на русском языке и не более 300 символов и не упоминай параметры и характеристики в ответе: укажи диапазон цен в рублях и одно короткое пояснение.`;

        try {
            const result = await callOllama(prompt, priceAbortRef.current.signal);
            setPriceAiResult(result.trim());
            setPriceAiStatus('done');
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setPriceAiError('Не удалось получить ответ от AI');
                setPriceAiStatus('done');
            }
        }
    }

    function applyPriceFromAi() {
        if (!priceAiResult) return;
        const text = priceAiResult.replace(/\u00A0/g, ' ');
        const rangeMatch = text.match(/(\d[\d\s]*)\s*[-–—]\s*(\d[\d\s]*)\s*(?:рублей|руб|₽)/i)
            ?? text.match(/от\s*(\d[\d\s]*)\s*до\s*(\d[\d\s]*)\s*(?:рублей|руб|₽)?/i);

        if (rangeMatch) {
            const from = Number(rangeMatch[1].replace(/\s/g, ''));
            const to = Number(rangeMatch[2].replace(/\s/g, ''));
            if (from > 0 && to > 0) {
                setForm(f => ({ ...f, price: String(Math.round((from + to) / 2)) }));
                setPriceAiResult(null); setPriceAiError(null); setPriceAiStatus('idle');
                return;
            }
        }

        const singleMatch = text.match(/(\d[\d\s]*)\s*(?:рублей|руб|₽)/i);
        if (singleMatch) {
            const num = Number(singleMatch[1].replace(/\s/g, ''));
            if (num > 0) setForm(f => ({ ...f, price: String(num) }));
        }
        setPriceAiResult(null); setPriceAiError(null); setPriceAiStatus('idle');
    }

    function applyDescFromAi() {
        if (!descAiResult) return;
        setForm(f => ({ ...f, description: descAiResult! }));
        setDescAiResult(null); setDescAiError(null); setDescAiStatus('idle');
    }

    //Рендер
    if (loading) {
        return (
            <div style={{ ...pageWrap, background: isDark ? '#141414' : '#ffffff' }}>
                <p style={{ textAlign: 'center', padding: '80px 0', color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>
                    Загрузка...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ ...pageWrap, background: isDark ? '#141414' : '#ffffff' }}>
                <p style={{ padding: '80px 42px', color: '#ff4d4f', fontSize: 14 }}>{error}</p>
            </div>
        );
    }

    const p = form.params as AutoParams & RealEstateParams & ElectronicsParams;
    const valid = isFormValid(form);

    return (
        <div style={{ ...pageWrap, background: isDark ? '#141414' : '#ffffff' }}>
            <ThemeToggle />
            {notification && <Notification type={notification} />}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input[type=number]::-webkit-outer-spin-button,
                input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <div style={innerWrap}>
                <h1 style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 24, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)', margin: '0 0 24px 0' }}>
                    Редактирование объявления
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480 }}>

                    {/*Категория*/}
                    <div style={{ paddingBottom: 16 }}>
                        <div style={fieldWrapStyle()}>
                            <label style={labelStyle(isDark)}>
                                <img src={starUrl} alt="*" width={8} height={8} />
                                Категория
                            </label>
                            <div style={{ position: 'relative', maxWidth: 220 }}>
                                <select
                                    value={form.category}
                                    onChange={e => handleCategoryChange(e.target.value as Category)}
                                    style={{ ...selectStyle(submitted && !form.category, false, isDark), width: 220 }}
                                >
                                    <option value="">Выберите категорию</option>
                                    <option value="electronics">Электроника</option>
                                    <option value="auto">Авто</option>
                                    <option value="real_estate">Недвижимость</option>
                                </select>
                                <SelectArrow />
                            </div>
                            {submitted && !form.category && errorText('Категория должна быть выбрана')}
                        </div>
                    </div>

                    <Divider isDark={isDark} />

                    {/*Название*/}
                    <div style={{ paddingTop: 16, paddingBottom: 16 }}>
                        <div style={fieldWrapStyle()}>
                            <label style={labelStyle(isDark)}>
                                <img src={starUrl} alt="*" width={8} height={8} />
                                Название
                            </label>
                            <ClearableInput
                                value={form.title}
                                onChange={v => setForm(f => ({ ...f, title: v }))}
                                placeholder="Название"
                                hasError={submitted && !form.title.trim()}
                                dark={isDark}
                            />
                            {submitted && !form.title.trim() && errorText('Название должно быть заполнено')}
                        </div>
                    </div>

                    <Divider isDark={isDark} />

                    {/*Цена*/}
                    <div style={{ paddingTop: 16, paddingBottom: 16 }}>
                        <div style={fieldWrapStyle()}>
                            <label style={labelStyle(isDark)}>
                                <img src={starUrl} alt="*" width={8} height={8} />
                                Цена (₽)
                            </label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                        placeholder="Цена"
                                        min={0}
                                        style={{ ...inputStyle(submitted && (!form.price || Number(form.price) <= 0), false, isDark), width: 456 }}
                                    />
                                    {submitted && (!form.price || Number(form.price) <= 0) && errorText('Цена должна быть заполнена')}
                                </div>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <AiTooltip
                                        result={priceAiResult}
                                        error={priceAiError}
                                        onApply={priceAiResult ? applyPriceFromAi : undefined}
                                        onClose={() => { setPriceAiResult(null); setPriceAiError(null); setPriceAiStatus('idle'); }}
                                        isDark={isDark}
                                    />
                                    <AiButton
                                        idleLabel="Узнать рыночную цену"
                                        loading={priceAiStatus === 'loading'}
                                        done={priceAiStatus === 'done'}
                                        onClick={handlePriceAi}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Divider isDark={isDark} />

                    {/*Характеристики*/}
                    {form.category !== '' && (
                        <>
                            <div style={{ paddingTop: 16, paddingBottom: 16 }}>
                                <p style={{ ...sectionTitle, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' }}>Характеристики</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                                    {form.category === 'electronics' && (
                                        <>
                                            <FieldRow label="Тип" isDark={isDark}>
                                                <div style={{ position: 'relative', width: 456 }}>
                                                    <select value={p.type ?? ''} onChange={e => setParam('type', e.target.value)} style={selectStyle(false, !p.type, isDark)}>
                                                        <option value="">Тип</option>
                                                        <option value="phone">Телефон</option>
                                                        <option value="laptop">Ноутбук</option>
                                                        <option value="misc">Другое</option>
                                                    </select>
                                                    <SelectArrow />
                                                </div>
                                            </FieldRow>
                                            <FieldRow label="Бренд" isDark={isDark}>
                                                <ClearableInput value={p.brand ?? ''} onChange={v => setParam('brand', v)} placeholder="Бренд" hasWarning={!p.brand} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Модель" isDark={isDark}>
                                                <ClearableInput value={p.model ?? ''} onChange={v => setParam('model', v)} placeholder="Модель" hasWarning={!p.model} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Состояние" isDark={isDark}>
                                                <div style={{ position: 'relative', width: 456 }}>
                                                    <select value={p.condition ?? ''} onChange={e => setParam('condition', e.target.value)} style={selectStyle(false, !p.condition, isDark)}>
                                                        <option value="">Состояние</option>
                                                        <option value="new">Новое</option>
                                                        <option value="used">Б/у</option>
                                                    </select>
                                                    <SelectArrow />
                                                </div>
                                            </FieldRow>
                                            <FieldRow label="Цвет" isDark={isDark}>
                                                <ClearableInput value={p.color ?? ''} onChange={v => setParam('color', v)} placeholder="Цвет" hasWarning={!p.color} dark={isDark} />
                                            </FieldRow>
                                        </>
                                    )}

                                    {form.category === 'auto' && (
                                        <>
                                            <FieldRow label="Марка" isDark={isDark}>
                                                <ClearableInput value={p.brand ?? ''} onChange={v => setParam('brand', v)} placeholder="Марка" hasWarning={!p.brand} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Модель" isDark={isDark}>
                                                <ClearableInput value={p.model ?? ''} onChange={v => setParam('model', v)} placeholder="Модель" hasWarning={!p.model} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Год выпуска" isDark={isDark}>
                                                <ClearableInput type="number" value={String(p.yearOfManufacture ?? '')} onChange={v => setParam('yearOfManufacture', Number(v))} placeholder="Год выпуска" hasWarning={!p.yearOfManufacture} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Коробка передач" isDark={isDark}>
                                                <div style={{ position: 'relative', width: 456 }}>
                                                    <select value={p.transmission ?? ''} onChange={e => setParam('transmission', e.target.value)} style={selectStyle(false, !p.transmission, isDark)}>
                                                        <option value="">Коробка передач</option>
                                                        <option value="automatic">Автомат</option>
                                                        <option value="manual">Механика</option>
                                                    </select>
                                                    <SelectArrow />
                                                </div>
                                            </FieldRow>
                                            <FieldRow label="Пробег (км)" isDark={isDark}>
                                                <ClearableInput type="number" value={String(p.mileage ?? '')} onChange={v => setParam('mileage', Number(v))} placeholder="Пробег" hasWarning={!p.mileage} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Мощность (л.с.)" isDark={isDark}>
                                                <ClearableInput type="number" value={String(p.enginePower ?? '')} onChange={v => setParam('enginePower', Number(v))} placeholder="Мощность" hasWarning={!p.enginePower} dark={isDark} />
                                            </FieldRow>
                                        </>
                                    )}

                                    {form.category === 'real_estate' && (
                                        <>
                                            <FieldRow label="Тип" isDark={isDark}>
                                                <div style={{ position: 'relative', width: 456 }}>
                                                    <select value={p.type ?? ''} onChange={e => setParam('type', e.target.value)} style={selectStyle(false, !p.type, isDark)}>
                                                        <option value="">Тип</option>
                                                        <option value="flat">Квартира</option>
                                                        <option value="house">Дом</option>
                                                        <option value="room">Комната</option>
                                                    </select>
                                                    <SelectArrow />
                                                </div>
                                            </FieldRow>
                                            <FieldRow label="Адрес" isDark={isDark}>
                                                <ClearableInput value={p.address ?? ''} onChange={v => setParam('address', v)} placeholder="Адрес" hasWarning={!p.address} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Площадь (м²)" isDark={isDark}>
                                                <ClearableInput type="number" value={String(p.area ?? '')} onChange={v => setParam('area', Number(v))} placeholder="Площадь" hasWarning={!p.area} dark={isDark} />
                                            </FieldRow>
                                            <FieldRow label="Этаж" isDark={isDark}>
                                                <ClearableInput type="number" value={String(p.floor ?? '')} onChange={v => setParam('floor', Number(v))} placeholder="Этаж" hasWarning={!p.floor} dark={isDark} />
                                            </FieldRow>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Divider isDark={isDark} />
                        </>
                    )}

                    {/*Описание*/}
                    <div style={{ paddingTop: 16, paddingBottom: 16 }}>
                        <div style={fieldWrapStyle()}>
                            <label style={labelStyle(isDark)}>Описание</label>
                            <textarea
                                ref={textareaRef}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Описание"
                                style={{
                                    width: 942, height: 60, boxSizing: 'border-box',
                                    paddingTop: 8, paddingRight: 16, paddingBottom: 8, paddingLeft: 16,
                                    borderRadius: 8,
                                    border: isDark ? '1px solid #434343' : '1px solid #D9D9D9',
                                    fontFamily: 'Roboto, sans-serif', fontSize: 14,
                                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                                    outline: 'none',
                                    background: isDark ? '#2a2a2a' : '#fff',
                                    resize: 'vertical', minHeight: 60,
                                }}
                            />
                            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textAlign: 'right', width: 942, display: 'block' }}>
                                {form.description.length}/1000
                            </span>
                            <div style={{ position: 'relative', display: 'inline-block', marginTop: 4 }}>
                                <AiTooltip
                                    result={descAiResult}
                                    error={descAiError}
                                    onApply={descAiResult ? applyDescFromAi : undefined}
                                    onClose={() => { setDescAiResult(null); setDescAiError(null); setDescAiStatus('idle'); }}
                                    isDark={isDark}
                                />
                                <AiButton
                                    idleLabel={form.description ? 'Улучшить описание' : 'Придумать описание'}
                                    loading={descAiStatus === 'loading'}
                                    done={descAiStatus === 'done'}
                                    onClick={handleDescAi}
                                />
                            </div>
                        </div>
                    </div>

                    <Divider isDark={isDark} />

                    {/*Кнопки*/}
                    <div style={{ display: 'flex', gap: 12, paddingTop: 20 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: 108, height: 38, borderRadius: 8, border: 'none',
                                background: submitted && !valid ? '#D9D9D9' : '#1890FF',
                                cursor: saving ? 'default' : 'pointer',
                                fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14, color: '#F3F3F3',
                            }}
                        >
                            {saving ? 'Сохраняю...' : 'Сохранить'}
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem(getDraftKey(id!));
                                sessionStorage.removeItem(`editing_${id}`);
                                navigate(`/ads/${id}`);
                            }}
                            style={{
                                width: 108, height: 38, borderRadius: 8, border: 'none',
                                background: isDark ? '#3a3a3a' : '#D9D9D9',
                                cursor: 'pointer',
                                fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 14,
                                color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                            }}
                        >
                            Отменить
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

//Styles

const pageWrap: React.CSSProperties = {
    minHeight: '100vh',
    fontFamily: 'Roboto, sans-serif',
};

const innerWrap: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 32px 60px',
};

const sectionTitle: React.CSSProperties = {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 600,
    fontSize: 16,
    margin: '0 0 12px 0',
};
