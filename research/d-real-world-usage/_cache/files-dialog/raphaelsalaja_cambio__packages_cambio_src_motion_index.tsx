import { Dialog } from "@base-ui-components/react/dialog";
import { motion } from "motion/react";

const Root = motion.create(Dialog.Root);
const Trigger = motion.create(Dialog.Trigger);
const Portal = motion.create(Dialog.Portal);
const Backdrop = motion.create(Dialog.Backdrop);
const Popup = motion.create(Dialog.Popup);
const Title = motion.create(Dialog.Title);
const Description = motion.create(Dialog.Description);
const Close = motion.create(Dialog.Close);

export const MotionDialog = {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close,
};
