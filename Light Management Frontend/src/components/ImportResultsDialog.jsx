import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "./ui/utils";

export function ImportResultsDialog({ open, onOpenChange, results, summary, title = "Import Results", id }) {
    if (!results || results.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent id={id} className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Import completed with {summary?.success || 0} successes and {summary?.failed || 0} failures.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4 py-4 border-b">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="size-3 rounded-full bg-green-500" />
                        <span className="font-medium">{summary?.success || 0} Successful</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="size-3 rounded-full bg-red-500" />
                        <span className="font-medium">{summary?.failed || 0} Failed</span>
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 py-4">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border",
                                    result.status === 'success'
                                        ? "bg-green-50/50 border-green-100"
                                        : "bg-red-50/50 border-red-100"
                                )}
                            >
                                {result.status === 'success' ? (
                                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 shrink-0" />
                                ) : (
                                    <XCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
                                )}

                                <div className="space-y-1">
                                    <p className={cn(
                                        "font-medium text-sm",
                                        result.status === 'success' ? "text-green-900" : "text-red-900"
                                    )}>
                                        {result.item}
                                    </p>
                                    <p className={cn(
                                        "text-sm",
                                        result.status === 'success' ? "text-green-700" : "text-red-700"
                                    )}>
                                        {result.message}
                                    </p>
                                    {result.reason && (
                                        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600 bg-red-100/50 p-2 rounded">
                                            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                                            <span>Reason: {result.reason}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
