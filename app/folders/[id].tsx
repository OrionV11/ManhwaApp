import { useLocalSearchParams } from 'expo-router';
import FolderDetail from '@/components/folders/FolderDetail';

export default function FolderPage() {
    const { id } = useLocalSearchParams();
    const folderId = Number(id);
    
    return <FolderDetail folderId={folderId} />;
}