import chakraPreset from '@chakra-ui/panda-preset'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
	//... other config
	preflight: false, // Disables the reset
	presets: [chakraPreset],
	outdir: 'styled-system',
	//... other config
})
