import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { downloadBackup, restoreBackup } from '../api/apiCaller';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { invalidateData } from '../store/mainDataSlice';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const BackupRestoreCard = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [restoreData, setRestoreData] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const fileInputRef = useRef(null);

    const handleDownload = async () => {
        try {
            toast.info('Starting backup download...');
            await downloadBackup();
            toast.success('Backup downloaded successfully');
        } catch (error) {
            toast.error('Failed to download backup');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                setRestoreData(json);
                setShowConfirm(true);
            } catch (error) {
                toast.error('Invalid JSON file');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        e.target.value = null;
    };

    const confirmRestore = async () => {
        if (!restoreData) return;

        setShowConfirm(false);
        setLoading(true);
        try {
            await restoreBackup(restoreData);
            toast.success('Database restored successfully! Reloading...');
            dispatch(invalidateData()); // Trigger UI refresh

            // Reload page to ensure all states (including those not in Redux) are fresh
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error('Failed to restore database: ' + error.message);
        } finally {
            setLoading(false);
            setRestoreData(null);
        }
    };

    return (
        <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Backup & Restore
                </CardTitle>
                <CardDescription>
                    Save your data or restore from a previous backup file.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button onClick={handleDownload} variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Download Backup
                </Button>

                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current.click()}
                        variant="outline"
                        className="w-full justify-start gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950/20"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Restore from File
                    </Button>
                </div>

                <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                                This action will <span className="font-bold text-red-600">permanently overwrite</span> your current database with the data from the selected backup file.
                                Current data that is not in the backup will be lost.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setRestoreData(null); setShowConfirm(false); }}>Cancel</Button>
                            <Button onClick={confirmRestore} className="bg-red-600 hover:bg-red-700">
                                Yes, Restore Database
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </CardContent>
        </Card>
    );
};

export default BackupRestoreCard;
