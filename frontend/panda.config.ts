import chakraPreset from '@chakra-ui/panda-preset'
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
	preflight: false,
	presets: [chakraPreset],
	outdir: 'styled-system',
})
