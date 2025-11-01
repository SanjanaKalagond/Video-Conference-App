"use client";
import { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"; // import DialogTitle
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Image from "next/image";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  instantMeeting?: boolean;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  className,
  children,
  handleClick,
  buttonText,
  image,
  buttonClassName,
  buttonIcon,
}: MeetingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border-none bg-dark-1 px-6 py-9 text-white">
        <div className="flex flex-col gap-6">
          {/* Image */}
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt="checked" width={72} height={72} />
            </div>
          )}

          {/* Radix DialogTitle */}
          <DialogTitle className={cn("text-3xl font-bold leading-[42px]", className)}>
            {title}
          </DialogTitle>

          {children}

          <Button
            className={cn(
              "bg-blue-1 focus-visible:ring-0 focus-visible:ring-offset-0",
              buttonClassName
            )}
            onClick={handleClick}
          >
            {buttonIcon && (
              <Image src={buttonIcon} alt="button icon" width={13} height={13} />
            )}{" "}
            &nbsp;
            {buttonText || "Schedule Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
