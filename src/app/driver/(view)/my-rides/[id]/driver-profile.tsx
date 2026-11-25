import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CallingIcon, MailIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "lucide-react";
import React from "react";

export default function DriverProfile() {
  return (
    <Dialog>
      <DialogTrigger className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-500 cursor-pointer text-sm hover:underline">
        View driver profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className="">
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="p-0.5 bg-linear-to-r from-cyan-400/80 to-violet-500/80 rounded-full">
              <Avatar className="size-24 bg-background rounded-full">
                <AvatarImage src="/user.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-lg font-bold">John Doe</h2>
          </div>
          <div className="p-2 flex flex-row justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon className="text-primary size-5" icon={MailIcon} />{" "}
              johndoe@email.com
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon
                className="text-primary size-5"
                icon={CallingIcon}
              />{" "}
              <a href="tel:+15551234567">+1 (555) 123-4567</a>
            </div>
          </div>
          <div className="bg-secondary p-6 rounded-lg grid grid-cols-3 gap-2 mt-2">
            <div className="flex justify-center items-center flex-col gap-1">
              <h2 className="text-xl text-primary font-semibold">1,600</h2>
              <p className="text-xs text-muted-foreground">Rides Taken</p>
            </div>
            <div className="flex justify-center items-center flex-col gap-1">
              <h2 className="text-xl text-amber-500 font-semibold">4.9</h2>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div className="flex justify-center items-center flex-col gap-1">
              <h2 className="text-xl text-primary font-semibold">4 Years</h2>
              <p className="text-xs text-muted-foreground">Experience</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center gap-4 w-full">
            <h3 className="text-lg font-semibold">
              Reviews{" "}
              <span className="text-muted-foreground font-light">(150)</span>
            </h3>
            <Button className="px-0" variant="link">
              View All
            </Button>
          </div>
          <Card className="bg-secondary ring-0 shadow">
            <CardHeader className="flex flex-row justify-between items-center gap-4">
              <div className="flex justify-start gap-2 items-center">
                <Avatar className="size-12 bg-background rounded-full">
                  <AvatarImage src="/user.png" />
                  <AvatarFallback>EM</AvatarFallback>
                </Avatar>
                <div className="">
                  <h4 className="font-semibold">Devon Lane</h4>
                  <p className="text-xs text-muted-foreground">Passenger</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="text-amber-500 fill-current" />
                <span className="text-sm font-semibold">4.9</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                “Expedited service was requested and pickup from the driver was
                very fast and earlier than expected”
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
