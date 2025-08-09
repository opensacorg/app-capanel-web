import { createFormHook } from "@tanstack/react-form";

import {
	Select,
	TextArea,
	TextField,
} from "../../other/demo.FormComponents.tsx";
import { SubscribeButton } from "../../ui/button/SubscribeButton.tsx";
import { fieldContext, formContext } from "./demo.form-context.ts";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		Select,
		TextArea,
	},
	formComponents: {
		SubscribeButton,
	},
	fieldContext,
	formContext,
});
