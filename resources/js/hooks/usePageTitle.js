import { useEffect } from 'react';
import { setPageTitle } from '../utils/pageTitle';

export default function usePageTitle(pageName) {
    useEffect(() => {
        setPageTitle(pageName);
    }, [pageName]);
}
