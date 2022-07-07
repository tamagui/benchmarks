import { config } from '@tamagui/config-base'
import { createTamagui } from 'tamagui'

const conf = createTamagui(config)

type Conf = typeof conf

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default conf
