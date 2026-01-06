import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
        >
            <Globe size={16} />
            {i18n.language === 'en' ? 'FR' : 'EN'}
        </Button>
    );
};
